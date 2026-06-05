import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project } = body;

    if (!project) {
      return NextResponse.json({ message: "Please provide a project name." }, { status: 400 });
    }

    const searchProject = project.toLowerCase().trim();
    const githubUsername = 'mukul-sharma-tech'; // Your GitHub Username

    // 1. Fetch all public repositories for your profile dynamically
    const reposUrl = `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`;
    const reposResponse = await fetch(reposUrl, {
      headers: { 'User-Agent': 'Vapi-Agent-Request' },
      next: { revalidate: 60 } // Cache list for 60 seconds
    });

    if (!reposResponse.ok) throw new Error('Failed to fetch repositories from GitHub');
    const repos = await reposResponse.json();

    // 2. Look for a fuzzy match (e.g., if project is "Chakra", look for a repo containing "chakra")
    const matchedRepo = repos.find((r: any) => 
      r.name.toLowerCase().includes(searchProject) || 
      (r.description && r.description.toLowerCase().includes(searchProject))
    );

    if (!matchedRepo) {
      return NextResponse.json({ 
        message: `I couldn't find a live public repository explicitly named ${project} on Mukul's GitHub right now.` 
      });
    }

    // 3. Fetch the latest 2 commits for the matched repository
    const commitsUrl = `https://api.github.com/repos/${githubUsername}/${matchedRepo.name}/commits`;
    const commitsResponse = await fetch(commitsUrl, {
      headers: { 'User-Agent': 'Vapi-Agent-Request' },
      next: { revalidate: 60 }
    });

    if (!commitsResponse.ok) throw new Error('Failed to fetch commits');
    const commitsData = await commitsResponse.json();

    const commits = commitsData.slice(0, 5).map((c: any) => ({
      date: new Date(c.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      message: c.commit.message
    }));

    if (commits.length === 0) {
      return NextResponse.json({ message: `The repository ${matchedRepo.name} has no recent commit history.` });
    }

    // 4. Format the natural voice response for Vapi
    let summary = `The most recent update to the ${project} repository was on ${commits[0].date} with the commit message: "${commits[0].message}".`;
    if (commits[1]) {
      summary += ` Shortly before that, a commit noted: "${commits[1].message}".`;
    }

    return NextResponse.json({ result: summary });

  } catch (error: any) {
    console.error('Dynamic GitHub API Error:', error.message);
    return NextResponse.json({ message: "I'm having trouble connecting to GitHub's real-time API right now." });
  }
}
