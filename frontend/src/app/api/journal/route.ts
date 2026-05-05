import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, model, content } = await request.json();

    if (!token || !model || !content) {
      return NextResponse.json({ error: 'Token, model, and content are required' }, { status: 400 });
    }

    const fileName = `journals/journal_${model.replace(/[\/\.]/g, '_')}.md`;
    const repo = 'LokiLaufeyson-TheTrickster/MaxG-v3.1';
    
    // 1. Get current file (to get SHA if exists)
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${fileName}`, {
      headers: { 'Authorization': `token ${token}` }
    });

    let sha = '';
    let existingContent = '';
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      existingContent = Buffer.from(data.content, 'base64').toString();
    }

    const timestamp = new Date().toISOString();
    const newEntry = `\n\n## ${timestamp}\n${content}`;
    const updatedContent = existingContent + newEntry;

    // 2. Update/Create file
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${fileName}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update journal for ${model}`,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: sha || undefined
      })
    });

    if (putRes.ok) {
      return NextResponse.json({ success: true });
    } else {
      const err = await putRes.json();
      return NextResponse.json({ error: err.message }, { status: putRes.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
