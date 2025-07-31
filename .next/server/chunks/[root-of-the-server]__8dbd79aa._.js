module.exports = {

"[project]/.next-internal/server/app/api/hanime/trending/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[project]/app/lib/hanime-api.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// app/lib/hanime-api.ts
__turbopack_context__.s({
    "HanimeAPI": (()=>HanimeAPI)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
class HanimeAPI {
    BASE_URL = "https://hanime.tv";
    SEARCH_URL = "https://search.htv-services.com";
    API_URL = "https://hanime.tv/api/v8";
    getHeaders() {
        return {
            'X-Signature-Version': 'web2',
            'X-Signature': __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex'),
            'X-Time': Math.floor(Date.now() / 1000).toString(),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://hanime.tv/'
        };
    }
    async getTrending(time = 'week', page = 0) {
        const url = `${this.API_URL}/browse-trending?time=${time}&page=${page}&order_by=views&ordering=desc`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        return {
            results: data.hentai_videos.map((video)=>({
                    id: video.id,
                    name: video.name,
                    slug: video.slug,
                    cover_url: video.cover_url,
                    poster_url: video.poster_url,
                    views: video.views,
                    likes: video.likes,
                    dislikes: video.dislikes,
                    rating: video.rating,
                    brand: video.brand,
                    duration: video.duration_in_ms,
                    is_censored: video.is_censored,
                    created_at: video.created_at,
                    tags: video.tags || []
                })),
            page,
            has_next: data.hentai_videos.length > 0
        };
    }
    async search(query, page = 0) {
        const response = await fetch(this.SEARCH_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getHeaders()
            },
            body: JSON.stringify({
                blacklist: [],
                brands: [],
                order_by: "created_at_unix",
                page,
                tags: [],
                search_text: query,
                tags_mode: "AND"
            })
        });
        if (!response.ok) throw new Error(`Search error: ${response.status}`);
        const data = await response.json();
        const results = JSON.parse(data.hits || '[]');
        return {
            results: results.map((video)=>({
                    id: video.id,
                    name: video.name,
                    slug: video.slug,
                    cover_url: video.cover_url,
                    poster_url: video.poster_url,
                    views: video.views,
                    likes: video.likes,
                    dislikes: video.dislikes,
                    brand: video.brand,
                    duration: video.duration_in_ms,
                    is_censored: video.is_censored,
                    tags: video.tags || []
                })),
            total: data.nbHits,
            pages: data.nbPages,
            page
        };
    }
    async getVideo(slug) {
        // First, get the video ID from the slug
        const videoUrl = `${this.API_URL}/video?id=${slug}`;
        const response = await fetch(videoUrl, {
            headers: this.getHeaders()
        });
        if (!response.ok) throw new Error(`Video error: ${response.status}`);
        const data = await response.json();
        const video = data.hentai_video;
        const manifest = data.videos_manifest;
        return {
            id: video.id,
            name: video.name,
            slug: video.slug,
            description: video.description,
            poster_url: video.poster_url,
            cover_url: video.cover_url,
            views: video.views,
            likes: video.likes,
            dislikes: video.dislikes,
            downloads: video.downloads,
            brand: video.brand,
            duration: video.duration_in_ms,
            is_censored: video.is_censored,
            created_at: video.created_at,
            released_at: video.released_at,
            tags: data.hentai_tags?.map((tag)=>({
                    name: tag.text,
                    id: tag.id,
                    count: tag.count
                })) || [],
            streams: manifest?.servers?.[0]?.streams?.map((stream)=>({
                    width: stream.width,
                    height: stream.height,
                    size_mbs: stream.filesize_mbs,
                    url: stream.url,
                    extension: stream.extension,
                    duration_ms: stream.duration_in_ms
                })) || [],
            episodes: data.hentai_franchise_hentai_videos?.map((ep)=>({
                    id: ep.id,
                    name: ep.name,
                    slug: ep.slug,
                    cover_url: ep.cover_url,
                    views: ep.views,
                    created_at: ep.created_at
                })) || []
        };
    }
    // app/lib/hanime-api.ts - Update the getVideoStreams method
    async getVideoStreams(slug) {
        // Try the newer API endpoint first
        const url = `${this.API_URL}/video?id=${slug}`;
        try {
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const manifest = data.videos_manifest;
            if (manifest?.servers) {
                const streams = manifest.servers.flatMap((server)=>server.streams || []).filter((stream)=>stream.url).map((stream)=>({
                        id: stream.id,
                        server_id: stream.server_id,
                        url: stream.url,
                        width: stream.width,
                        height: stream.height,
                        quality: `${stream.height}p`,
                        size_mbs: stream.filesize_mbs,
                        duration_ms: stream.duration_in_ms,
                        extension: stream.extension
                    }));
                return streams;
            }
        } catch (error) {
            console.error('Primary streams endpoint failed:', error);
        }
        // Fallback to the alternative endpoint
        const fallbackUrl = `${this.BASE_URL}/rapi/v7/videos_manifests/${slug}`;
        const response = await fetch(fallbackUrl, {
            headers: this.getHeaders()
        });
        if (!response.ok) throw new Error(`Streams error: ${response.status}`);
        const json = await response.json();
        const manifest = json.videos_manifest;
        if (!manifest?.servers) throw new Error('No servers found');
        const streams = manifest.servers.flatMap((server)=>server.streams || []).filter((stream)=>stream.url).map((stream)=>({
                id: stream.id,
                server_id: stream.server_id,
                url: stream.url,
                width: stream.width,
                height: stream.height,
                quality: `${stream.height}p`,
                size_mbs: stream.filesize_mbs,
                duration_ms: stream.duration_in_ms,
                extension: stream.extension
            }));
        return streams;
    }
    async getTags() {
        const url = `${this.API_URL}/browse`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        if (!response.ok) throw new Error(`Tags error: ${response.status}`);
        const data = await response.json();
        return data.hentai_tags?.map((tag)=>({
                id: tag.id,
                name: tag.text,
                count: tag.count,
                url: `/tags/${tag.text}`
            })) || [];
    }
    async getVideosByTag(tag, page = 0) {
        const url = `${this.API_URL}/browse/hentai-tags/${encodeURIComponent(tag)}?page=${page}&order_by=views&ordering=desc`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        if (!response.ok) throw new Error(`Tag videos error: ${response.status}`);
        const data = await response.json();
        return {
            results: data.hentai_videos.map((video)=>({
                    id: video.id,
                    name: video.name,
                    slug: video.slug,
                    cover_url: video.cover_url,
                    poster_url: video.poster_url,
                    views: video.views,
                    brand: video.brand,
                    duration: video.duration_in_ms,
                    is_censored: video.is_censored,
                    tags: video.tags || []
                })),
            page,
            has_next: data.hentai_videos.length > 0
        };
    }
}
}}),
"[project]/app/api/hanime/trending/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// app/api/hanime/trending/route.ts
__turbopack_context__.s({
    "GET": (()=>GET)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$5_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.5_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$hanime$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/hanime-api.ts [app-route] (ecmascript)");
;
;
const api = new __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$hanime$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HanimeAPI"]();
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const time = searchParams.get('time') || 'week';
        const page = parseInt(searchParams.get('page') || '0');
        const data = await api.getTrending(time, page);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$5_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error('[Trending API] Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$5_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch trending',
            details: error.message
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__8dbd79aa._.js.map