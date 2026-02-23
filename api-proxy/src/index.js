import { AutoRouter, cors } from 'itty-router';

// CORS設定（すべてのオリジンからのGETを許可）
const { preflight, corsify } = cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
});

const router = AutoRouter({
    before: [preflight],
    finally: [corsify],
});

// microCMS API fetch function
async function fetchCMS(endpoint, env) {
    const baseUrl = env.CMS_BASE_URL.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = new URL(baseUrl + path);
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'X-MICROCMS-API-KEY': env.CMS_API_KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) return null;
    return response.json();
}

// OGPインジェクション用の HTMLRewriter ハンドラー
class OGPInjector {
    constructor(ogData = {}) {
        this.ogData = ogData;
    }
    element(element) {
        if (this.ogData.title) {
            element.append(`<meta property="og:title" content="${this.ogData.title}" />`, { html: true });
            element.append(`<meta name="twitter:title" content="${this.ogData.title}" />`, { html: true });
        }
        if (this.ogData.description) {
            element.append(`<meta property="og:description" content="${this.ogData.description}" />`, { html: true });
            element.append(`<meta name="twitter:description" content="${this.ogData.description}" />`, { html: true });
        }
        if (this.ogData.image) {
            element.append(`<meta property="og:image" content="${this.ogData.image}" />`, { html: true });
            element.append(`<meta name="twitter:image" content="${this.ogData.image}" />`, { html: true });
            element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        }
        if (this.ogData.url) {
            element.append(`<meta property="og:url" content="${this.ogData.url}" />`, { html: true });
        }
    }
}

// /api/* のリクエストをmicroCMSにプロキシする
// itty-router v5+ では router.get('/') の第一引数が request, 第二引数が env 等になります
router.get('/api/*', async (request, env) => {
    if (!env.CMS_BASE_URL || !env.CMS_API_KEY) {
        return new Response(JSON.stringify({ error: 'CMS configurations are missing in the environment' }), { status: 500 });
    }

    const url = new URL(request.url);

    // 例: /api/photos?limit=10 -> https://your-service.microcms.io/api/v1/photos?limit=10
    const cmsPath = url.pathname.replace('/api/', '/');
    const baseUrl = env.CMS_BASE_URL.replace(/\/+$/, '');
    const path = cmsPath.startsWith('/') ? cmsPath : '/' + cmsPath;
    const targetUrl = new URL(baseUrl + path);

    url.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    try {
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'X-MICROCMS-API-KEY': env.CMS_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Error making request to CMS:", error.message, error.stack);
        return new Response(JSON.stringify({ error: 'Failed to fetch from CMS' }), { status: 502 });
    }
});

// HTMLリクエストに対するOGPタグの動的生成
router.get('/*.html', async (request, env) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const id = url.searchParams.get('id');

    // Cloudflare Pages 等でホストされている元のHTMLを取得
    // ※ローカルテスト時はWranglerがAssetsを参照するため、本番では env.ASSETS.fetch を使う想定
    let htmlResponse;
    try {
        // env.ASSETS が存在する場合はそれを使う (Pages/Workers Assets)
        if (env.ASSETS) {
            htmlResponse = await env.ASSETS.fetch(request);
        } else {
            // なければそのまま返すか、オリジンへフォールバック
            htmlResponse = await fetch(request);
        }
    } catch (e) {
        return new Response("Not Found", { status: 404 });
    }

    // idがなければそのままHTMLを返す
    if (!id || (path !== '/project.html' && path !== '/blog.html')) {
        return htmlResponse;
    }

    let ogData = {
        url: request.url
    };

    if (path === '/project.html') {
        const project = await fetchCMS(`/projects/${id}`, env);
        if (project) {
            ogData.title = `${project.title || 'Project'} | JAN Studio`;
            ogData.description = project.summary || 'JAN Studio の撮影案件詳細。';
            if (project.mainImage?.url) {
                ogData.image = project.mainImage.url + "?w=1200&h=630&fit=crop";
            }
        }
    } else if (path === '/blog.html') {
        const post = await fetchCMS(`/blogPosts/${id}`, env);
        if (post) {
            ogData.title = `${post.title || 'Blog'} | JAN Studio`;
            // htmlタグを取り除く簡易処理
            ogData.description = post.body ? post.body.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' : 'JAN Studio ジャーナル記事';
            if (post.thumbnail?.url) {
                ogData.image = post.thumbnail.url + "?w=1200&h=630&fit=crop";
            }
        }
    }

    // HTMLRewriterを使って <head> 内に meta タグを挿入
    const rewriter = new HTMLRewriter()
        .on('head', new OGPInjector(ogData));

    return rewriter.transform(htmlResponse);
});

// API以外のリクエストはNot Found（静的ファイルはWranglerが自動的に/publicから配信する）
router.all('*', (request, env) => {
    if (env.ASSETS) {
        return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
});

export default {
    fetch: router.fetch,
};
