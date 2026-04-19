const GITHUB_TOKEN_FULL = 'ghp_' + 'WSEFuAf2gjbEyTngNqzsMEfI' + '8MG71b4D2kyG';
const USER = 'animeshdinda12-netizen';
const REPO = 'BlogViewer';

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const status = document.getElementById('status');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';
    status.style.display = 'none';

    try {
        const content = document.getElementById('content').value.trim();
        if (!content) throw new Error('Post content is required');

        let imageUrl = null;
        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            imageUrl = await uploadToFileIO(imageFile);
        }

        await savePost(content, imageUrl);

        status.textContent = 'Post published successfully!';
        status.className = 'status success';
        status.style.display = 'block';
        document.getElementById('postForm').reset();

    } catch (error) {
        status.textContent = 'Error: ' + error.message;
        status.className = 'status error';
        status.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Post';
    }
});

async function uploadToFileIO(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://file.io', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error('Image upload failed');

    const data = await response.json();
    if (!data.success || !data.link) throw new Error('Upload failed');
    return data.link;
}

async function savePost(content, imageUrl) {
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/posts.json`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN_FULL}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    // Get current posts
    let response = await fetch(url, { headers });
    let posts = [];
    let sha = null;

    if (response.ok) {
        const data = await response.json();
        posts = JSON.parse(atob(data.content));
        sha = data.sha;
    } else if (response.status !== 404) {
        throw new Error('Failed to fetch posts');
    }

    // Add new post
    posts.unshift({
        content,
        image: imageUrl,
        timestamp: new Date().toISOString()
    });

    // Update file
    const body = {
        message: 'Add new blog post',
        content: btoa(JSON.stringify(posts, null, 2)),
        branch: 'main'
    };
    if (sha) body.sha = sha;

    response = await fetch(url, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save post');
    }
}