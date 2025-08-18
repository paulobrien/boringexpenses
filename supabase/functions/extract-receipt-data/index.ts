import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReceiptData {
  description: string;
  location: string;
  date: string;
  amount: number;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTHENTICATION START ---
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    // --- AUTHENTICATION END ---

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert image to base64
    const imageBytes = await imageFile.arrayBuffer();
    
    // Check file size (limit to 5MB to prevent memory issues)
    if (imageBytes.byteLength > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Please use images smaller than 5MB.' }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Convert to base64 without causing stack overflow for large images
    const uint8Array = new Uint8Array(imageBytes);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Image = btoa(binary);
    const mimeType = imageFile.type;

    // Prepare the request to Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;
    
    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    - description: A concise description of what was purchased (e.g., "Business lunch", "Office supplies", "Taxi ride")
    - location: The business name or location where the purchase was made
    - date: The date of the transaction in ISO format (YYYY-MM-DDTHH:MM:SS) - if time is not available, use 12:00:00
    - amount: The total amount as a number (just the numeric value, no currency symbols)
    - confidence: A confidence score from 0 to 1 indicating how confident you are in the extraction

    If you cannot extract any field clearly, use reasonable defaults:
    - description: "Expense" 
    - location: ""
    - date: current date with 12:00:00 time
    - amount: 0
    - confidence: 0.1

    Return only valid JSON with no additional text or formatting.
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      }
    };

    // Call Gemini API
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process receipt with AI',
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return new Response(
        JSON.stringify({ 
          error: 'No response from AI model',
          fallback: {
            description: 'Expense',
            location: '',
            date: new Date().toISOString(),
            amount: 0,
            confidence: 0.1
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the JSON response from Gemini
    let extractedData: ReceiptData;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = responseText.replace(/```json\n?|```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
      
      // Validate the extracted data
      if (typeof extractedData.amount === 'string') {
        extractedData.amount = parseFloat(extractedData.amount.replace(/[^\d.-]/g, ''));
      }
      
      // Ensure required fields exist
      extractedData.description = extractedData.description || 'Expense';
      extractedData.location = extractedData.location || '';
      extractedData.amount = extractedData.amount || 0;
      extractedData.confidence = extractedData.confidence || 0.5;
      
      // Validate date format
      if (extractedData.date) {
        const parsedDate = new Date(extractedData.date);
        if (isNaN(parsedDate.getTime())) {
          extractedData.date = new Date().toISOString();
        } else {
          extractedData.date = parsedDate.toISOString();
        }
      } else {
        extractedData.date = new Date().toISOString();
      }
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      extractedData = {
        description: 'Expense',
        location: '',
        date: new Date().toISOString(),
        amount: 0,
        confidence: 0.1
      };
    }

    return new Response(
      JSON.stringify(extractedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in extract-receipt-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});