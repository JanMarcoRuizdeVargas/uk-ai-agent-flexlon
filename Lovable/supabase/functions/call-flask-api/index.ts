const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flaskUrl } = await req.json();
    
    if (!flaskUrl) {
      return new Response(
        JSON.stringify({ error: 'Flask API URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling Flask API at:', flaskUrl);

    // Call the Flask API
    const response = await fetch(flaskUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Flask API responded with status: ${response.status}`);
    }

    const data = await response.text();
    console.log('Flask API response:', data);

    // Parse the response - handle both JSON and plain text
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      // If not JSON, split by lines
      parsedData = { 
        output: data.split('\n').filter(line => line.trim() !== '')
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error calling Flask API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to call Flask API'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});