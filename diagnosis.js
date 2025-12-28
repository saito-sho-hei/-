// 診断ロジック

const questions = [
    {
        category: "Q1. 自走率（Autonomy Rate）",
        text: "ちょっと難しいトラブルが起きた。どうする？",
        options: {
            A: { text: "すぐに状況を報告し、指示を仰ぐ。", score: -0.8 },
            B: { text: "解決策を3つ考え、推奨案を決めてから「これでいいですか？」と聞く。", score: 0.8 }
        }
    },
    {
        category: "Q2. 成功率（Success Rate）",
        text: "営業として、バカ売れしているNo.1商品と、全く売れない無名商品、どっちを売りたい？",
        options: {
            A: { text: "No.1商品。数字が出て評価されやすいから。", score: 0 }, // 割引適用で低め
            B: { text: "無名商品。工夫して売るのが面白そうだから。", score: 0.9 }
        }
    },
    {
        category: "Q3. 検知率（Detection Rate）",
        text: "今日は何もトラブルがなく、定時で帰れそうです。どう思う？",
        options: {
            A: { text: "ラッキー！運が良かった。", score: 0 },
            B: { text: "朝のうちに設定を変えて、先手を打っておいた自分を褒めたい。", score: 0.95 }
        }
    },
    {
        category: "Q4. 再現率（Consistency Rate）",
        text: "毎日同じデータを1000件入力する仕事。どう感じる？",
        options: {
            A: { text: "退屈で死にそう。適当にやりそう。", score: 0 },
            B: { text: "1000件ノーミスで最速タイムを出すことに命を燃やす。", score: 0.634 }
        }
    },
    {
        category: "Q5. アシスト・連帯責任",
        text: "アドバイスした後輩が大失敗した。上司に詰められている。どうする？",
        options: {
            A: { text: "実行したのは彼だし、自分は励ますことしかできない。", score: 0 },
            B: { text: "口を出した以上、自分にも責任がある。一緒に頭を下げる。", score: 3.0 } // プレイメーカー評価
        }
    }
];

let currentStep = 0;
let totalScore = 0;
let answers = []; // 'A' or 'B'

// 要素の取得
const screenWelcome = document.getElementById('screen-welcome');
const screenQuestion = document.getElementById('screen-question');
const screenResult = document.getElementById('screen-result');

function startDiagnosis() {
    currentStep = 0;
    totalScore = 0;
    answers = [];
    screenWelcome.classList.remove('active');
    screenQuestion.classList.add('active');
    showQuestion();
}

function showQuestion() {
    const q = questions[currentStep];
    document.getElementById('question-category').innerText = q.category;
    document.getElementById('question-text').innerText = q.text;
    document.getElementById('option-a-text').innerText = q.options.A.text;
    document.getElementById('option-b-text').innerText = q.options.B.text;

    // プログレスバーの更新
    const progress = ((currentStep) / questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function answerQuestion(choice) {
    const q = questions[currentStep];
    const score = q.options[choice].score;

    totalScore += score;
    answers.push(choice);

    currentStep++;
    if (currentStep < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    screenQuestion.classList.remove('active');
    screenResult.classList.add('active');

    // プログレスバー100%
    document.getElementById('progress-fill').style.width = '100%';

    // 結果判定ロジック
    // タイプA: Q1, Q2がB (自律・挑戦)
    // タイプB: Q3, Q4がB (守備・再現)

    let resultType = "";
    let resultDesc = "";
    const isQ1B = answers[0] === 'B';
    const isQ2B = answers[1] === 'B';
    const isQ3B = answers[2] === 'B';
    const isQ4B = answers[3] === 'B';

    if (isQ1B && isQ2B) {
        resultType = "タイプA：不運な実力者\n(Unlucky Expert)";
        resultDesc = "現在の社内評価: Cランク（過小評価）。<br>難易度Sの壁に挑んでいるあなたの突破力は、環境ノイズを除去すれば平均的社員の1.6倍の価値があります。";
    } else if (isQ3B && isQ4B) {
        resultType = "タイプB：沈黙の守護神\n(Silent Guardian)";
        resultDesc = "現在の社内評価: Bランク（地味）。<br>トラブルを未然に防ぎすぎているため、逆に評価されていません。防火管理者としてのあなたの価値を地方企業は求めています。";
    } else {
        // フォールバック（標準タイプ）
        resultType = "タイプC：堅実なバランサー\n(Solid Balancer)";
        resultDesc = "現在の社内評価: Bランク（標準）。<br>あなたは攻めと守りのバランスが取れた優秀な人材です。環境次第でさらにスコアは伸びるでしょう。";
    }

    // スコア表示調整 (小数点第2位まで)
    const formattedScore = (totalScore > 0 ? "+" : "") + totalScore.toFixed(2);

    // 結果をグローバル変数に保存 (シェア用)
    window.currentResultType = resultType.replace(/\n/g, " "); // 改行除去
    window.currentResultDesc = resultDesc.replace(/<br>/g, " ").replace(/<[^>]*>/g, ""); // HTMLタグ除去

    document.getElementById('result-type').innerText = resultType;
    document.getElementById('result-score-value').innerText = formattedScore;
    document.getElementById('result-description').innerHTML = resultDesc;
}

function shareResult() {
    const score = (totalScore > 0 ? "+" : "") + totalScore.toFixed(2);
    const type = window.currentResultType || "診断結果";

    // 評価コメントは長すぎる可能性があるので、冒頭の重要な部分（ランク評価など）だけ抜粋するか、全体を入れるか。
    // ここでは全文を入れると文字数オーバー確実なので、タイプ名とスコア、ハッシュタグを優先。
    // ユーザー要望「タイプと評価内容も」に対応するため、評価の最初の文（現在の社内評価など）を含める。
    const descShort = window.currentResultDesc ? window.currentResultDesc.split("。")[0] + "。" : "";

    const text = `【Human WAR診断】\n私のスコア: ${score}\n判定: ${type}\n${descShort}\n\n純粋な実力を測定します。`;
    const url = "https://neko-soroban.vercel.app/diagnosis.html"; // 本番URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=HumanWAR診断,地方メーカー活躍論`;
    window.open(twitterUrl, '_blank');
}
