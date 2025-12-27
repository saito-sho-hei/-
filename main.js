// ============================================
// 設定エリア
// ============================================
const NOTE_RSS_URL = 'https://note.com/open_flea2519/rss';

// ============================================

// グローバル変数として記事データを保持
let allPostsData = [];

document.addEventListener('DOMContentLoaded', () => {
    // Main Page Container
    const postsContainer = document.getElementById('latest-posts-grid');
    if (postsContainer) {
        fetchNotePosts(postsContainer);
    }

    // Subpage Containers
    const managementContainer = document.getElementById('related-posts-management');
    if (managementContainer) fetchNotePosts(managementContainer, 'Management');

    const analyticsContainer = document.getElementById('related-posts-analytics');
    if (analyticsContainer) fetchNotePosts(analyticsContainer, 'Analytics');

    const careerContainer = document.getElementById('related-posts-career');
    if (careerContainer) fetchNotePosts(careerContainer, 'Career');

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('is-active');
            nav.classList.toggle('is-active');
        });
    }
});

async function fetchNotePosts(container, filterCategory = null) {
    // NoteのRSSには画像が <media:thumbnail> にしか含まれておらず、
    // rss2json などの変換サービスでは画像が欠落することがあるため、
    // CORSプロキシを通して「生のXML」を取得し、ブラウザで解析する方法に切り替えます。

    // 複数のプロキシを候補に用意 (信頼性向上のため)
    const proxies = [
        url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` // rawをつけるとXMLがそのまま返る
    ];

    let xmlDoc = null;
    let fetchSuccess = false;

    // プロキシを順番に試す
    for (const proxy of proxies) {
        if (fetchSuccess) break;
        try {
            // 読み込み負荷を下げるため、キャッシュを「10分間」効かせるように調整
            // 1秒 = 1000ms, 1分 = 60000ms, 10分 = 600000ms
            const timestamp = Math.floor(Date.now() / 600000);
            const proxyUrl = proxy(NOTE_RSS_URL) + `&t=${timestamp}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

            const xmlText = await response.text();

            // XMLパース
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlText, "text/xml");

            // パースエラーのチェック
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("XML parsing failed");
            }

            fetchSuccess = true;
            console.log("RSS fetch success via", proxyUrl);
        } catch (e) {
            console.warn(`Proxy failed: ${e.message}`);
        }
    }

    if (fetchSuccess && xmlDoc) {
        // パースしてデータを整形・保存
        allPostsData = parseXMLToPosts(xmlDoc);

        if (filterCategory) {
            const filtered = allPostsData.filter(post => post.category === filterCategory);
            renderPosts(filtered, container);
        } else {
            renderPosts(allPostsData, container);
        }
    } else {
        console.error('All RSS fetches failed');
        useFallbackPosts(container, filterCategory);
    }
}

// XMLから記事オブジェクトの配列を生成する関数
function parseXMLToPosts(xmlDoc) {
    const items = xmlDoc.querySelectorAll('item');
    const posts = [];

    items.forEach((item, i) => {
        const title = item.querySelector('title').textContent;
        const link = item.querySelector('link').textContent;
        const pubDateText = item.querySelector('pubDate').textContent;
        const dateObj = new Date(pubDateText);
        const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
        const description = item.querySelector('description')?.textContent || '';

        // 画像取得
        let imageUrl = '';
        const mediaThumbnail = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0]
            || item.getElementsByTagName('media:thumbnail')[0];

        if (mediaThumbnail) imageUrl = mediaThumbnail.getAttribute('url') || mediaThumbnail.textContent;
        if (!imageUrl) {
            const match = description.match(/<img[^>]+src="([^">]+)"/);
            if (match) imageUrl = match[1];
        }
        if (!imageUrl) imageUrl = `https://loremflickr.com/600/400/business?lock=${i}`;

        // カテゴリ自動判定ロジック
        // Noteのタグ(category)を優先的にチェック
        let cleanCategory = 'Management'; // デフォルトは「経営の知恵袋」
        const categoryTags = Array.from(item.querySelectorAll('category')).map(c => c.textContent);
        const allText = (title + ' ' + categoryTags.join(' ')).toLowerCase();

        // 判定ルール (タグ推奨)
        // 1. 賢い学生の地方戦略 (Career)
        if (allText.match(/就職|学生|キャリア|新卒|地方|戦略|現場|中小企業|文系|メーカー|事務|面接|職種|四季報|ホワイト|偏差値|資格/)) {
            cleanCategory = 'Career';
        }
        // 2. 組織の数理分析 (Analytics)
        else if (allText.match(/分析|人事|ai|数理|データ|war|human/)) {
            cleanCategory = 'Analytics';
        }
        // 3. 経営の知恵袋 (Management) - 上記以外、または以下のキーワード
        else if (allText.match(/経営|スキル|トピックス|コラム|気づき|知識/)) {
            cleanCategory = 'Management';
        }

        posts.push({
            title,
            link,
            dateStr,
            imageUrl,
            category: cleanCategory,
            originalTags: categoryTags
        });
    });

    return posts;
}

// フィルタリング機能
window.filterPosts = function (category) {
    const container = document.getElementById('latest-posts-grid');
    if (!container) return;

    // ヘッダーのテキストを更新する演出（オプション）
    const header = document.querySelector('main h2');
    if (header) {
        if (category === 'All') header.textContent = '🚀 最新の記事（すべて）';
        else if (category === 'Management') header.textContent = '📚 経営の知識と現場トピックス';
        else if (category === 'Analytics') header.textContent = '📊 組織・人事とAI活用';
        else if (category === 'Career') header.textContent = '🚀 地方就職の戦略論';
    }

    if (category === 'All') {
        renderPosts(allPostsData, container);
    } else {
        const filtered = allPostsData.filter(post => post.category === category);
        renderPosts(filtered, container);
    }
};

// 描画関数
function renderPosts(postsData, container) {
    let html = '';
    const displayCount = Math.min(postsData.length, 6); // 最大表示数

    if (postsData.length === 0) {
        container.innerHTML = '<p>該当する記事が見つかりませんでした。</p>';
        return;
    }

    for (let i = 0; i < displayCount; i++) {
        const post = postsData[i];

        let categoryClass = 'cat-media';
        if (post.category === 'Analytics') categoryClass = 'cat-analytics';
        if (post.category === 'Career') categoryClass = 'cat-career';
        // Managementは cat-media (orange) を再利用するか、別途定義するか。
        // ここではManagement=Orangeとするため cat-media を使う
        if (post.category === 'Management') categoryClass = 'cat-media';

        // 表示用カテゴリ名（日本語）
        let displayCategory = post.category;
        if (post.category === 'Management') displayCategory = '経営・トピックス';
        if (post.category === 'Analytics') displayCategory = '組織・AI';
        if (post.category === 'Career') displayCategory = '就職戦略';

        html += `
            <article class="post-card">
                <a href="${post.link}" class="post-link" target="_blank" rel="noopener noreferrer">
                    <div class="post-image">
                        <img src="${post.imageUrl}" alt="${post.title}" loading="lazy">
                        <span class="post-category ${categoryClass}">${displayCategory}</span>
                    </div>
                    <div class="post-content">
                        <time class="post-date">${post.dateStr}</time>
                        <h3 class="post-title">${post.title}</h3>
                    </div>
                </a>
            </article>
        `;
    }

    container.innerHTML = html;
}

function useFallbackPosts(container, filterCategory = null) {
    if (filterCategory) {
        container.innerHTML = '<p class="no-posts-message">記事が見つかりませんでした。</p>';
    } else {
        container.innerHTML = '<p class="error-message">Noteの記事を読み込めませんでした。<br>時間をおいて再読み込みしてください。</p>';
    }
}
