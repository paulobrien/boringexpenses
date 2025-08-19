import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  question: string;
}

interface ChatResponse {
  answer: string;
  error?: string;
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
    const { question }: ChatRequest = await req.json();
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid question' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user's expense data
    const { data: expenses, error: expenseError } = await supabaseClient
      .from('expenses')
      .select(`
        id,
        date,
        description,
        location,
        amount,
        created_at,
        expense_categories(name)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expense data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Helper function to format currency as GBP
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(amount);
    };

    // Format expense data for AI
    const expenseData = expenses?.map(expense => ({
      date: expense.date,
      description: expense.description,
      location: expense.location,
      amount: expense.amount,
      category: expense.expense_categories?.name || 'Uncategorized'
    })) || [];

    // Calculate some basic statistics
    const totalExpenses = expenseData.length;
    const totalAmount = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
    const avgAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    // Get date range
    const dates = expenseData.map(exp => new Date(exp.date));
    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    // Prepare the prompt for Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;
    
    const prompt = `
You are an AI assistant helping a user analyze their expense data. Answer their question based on the provided expense information.

EXPENSE DATA SUMMARY:
- Total expenses: ${totalExpenses}
- Total amount spent: ${formatCurrency(totalAmount)}
- Average expense: ${formatCurrency(avgAmount)}
- Date range: ${earliestDate ? earliestDate.toDateString() : 'N/A'} to ${latestDate ? latestDate.toDateString() : 'N/A'}

DETAILED EXPENSE DATA:
${JSON.stringify(expenseData, null, 2)}

USER QUESTION: "${question}"

INSTRUCTIONS:
1. Analyze the expense data to answer the user's question accurately
2. Provide specific numbers, dates, and amounts when relevant
3. If the question asks about trends, identify patterns in the data
4. If the question asks about categories, group by category or location as appropriate
5. Be conversational and helpful
6. If the data doesn't contain enough information to answer the question, say so politely
7. Format currency amounts in British Pounds (£) with proper formatting
8. Handle expenses that have no category (marked as "Uncategorized") appropriately
9. Keep responses concise but informative

Answer the user's question now:
    `;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
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
          error: 'Failed to process question with AI',
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
          answer: 'I apologize, but I was unable to process your question at this time. Please try again.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response: ChatResponse = {
      answer: responseText.trim()
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in chat-with-receipts function:', error);
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
