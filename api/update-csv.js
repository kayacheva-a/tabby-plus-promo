// Cloudflare Worker to update GitHub CSV file
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json();
      const { csvContent, fileName = 'benefits-library.csv' } = data;

      if (!csvContent) {
        return new Response('CSV content is required', { status: 400 });
      }

      // Decode Base64 content
      const decodedCsvContent = atob(csvContent);

      // GitHub API configuration
      const GITHUB_TOKEN = env.GITHUB_TOKEN;
      const GITHUB_OWNER = 'kayacheva-a';
      const GITHUB_REPO = 'tabby-plus-promo';
      const GITHUB_PATH = `promo/${fileName}`;

      // Get current file to get SHA (required for updates)
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      let sha = null;
      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }

      // Update file via GitHub API
      const updateResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Update ${fileName} - Add new benefit`,
            content: btoa(decodedCsvContent), // Base64 encode the decoded content
            sha: sha, // Include SHA for updates
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('GitHub API error:', errorData);
        return new Response(
          JSON.stringify({ error: 'Failed to update file', details: errorData }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const result = await updateResponse.json();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'CSV file updated successfully',
          commit: result.commit
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );

    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  },
};
