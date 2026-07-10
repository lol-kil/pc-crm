// Vercel Serverless Function
// Deploy: vercel deploy

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    const token = process.env.GH_TOKEN;
    const owner = 'lol-kil';
    const repo = 'pc-crm';
    const path = 'data.json';

    if (!token) {
      return res.status(500).json({ error: 'Token not configured' });
    }

    // Get current file SHA
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    let sha = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // Encode data
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    // Update file
    const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'auto: crm data update',
        content,
        ...(sha && { sha })
      })
    });

    if (!updateRes.ok) {
      const error = await updateRes.json();
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Data saved' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
