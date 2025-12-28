// 診断ロジック

const questions = [
    {
        category: "Q1. 自走率（Autonomy Rate）",
        text: "ちょっと難しいトラブルが起きた。どうする？",
        options: {
            A: { text: "すぐに状況を報告し、指示を仰ぐ。", score: -0.8, effect: "InterventionTax += 0.8" },
            B: { text: "解決策を3つ考え、推奨案を決めてから「これでいいですか？」と聞く。", score: 0.8, effect: "ManagementCost = 0" }
        }
    },
    {
        category: "Q2. 成功率（Success Rate）",
        text: "営業として、バカ売れしているNo.1商品と、全く売れない無名商品、どっちを売りたい？",
        options: {
            A: { text: "No.1商品。数字が出て評価されやすいから。", score: 0, effect: "ProductDiscount = 50%" },
            B: { text: "無名商品。工夫して売るのが面白そうだから。", score: 0.9, effect: "DifficultyBonus = S-Rank" }
        }
    },
    {
        category: "Q3. 検知率（Detection Rate）",
        text: "今日は何もトラブルがなく、定時で帰れそうです。どう思う？",
        options: {
            A: { text: "ラッキー！運が良かった。", score: 0, effect: "DetectionRate = LOW" },
            B: { text: "朝のうちに設定を変えて、先手を打っておいた自分を褒めたい。", score: 0.95, effect: "SilentKill += 1" }
        }
    },
    {
        category: "Q4. 再現率（Consistency Rate）",
        text: "毎日同じデータを1000件入力する仕事。どう感じる？",
        options: {
            A: { text: "退屈で死にそう。適当にやりそう。", score: 0, effect: "EntropyRisk += HIGH" },
            B: { text: "1000件ノーミスで最速タイムを出すことに命を燃やす。", score: 0.634, effect: "Consistency = 99.9%" }
        }
    },
    {
        category: "Q5. アシスト・連帯責任",
        text: "アドバイスした後輩が大失敗した。上司に詰められている。どうする？",
        options: {
            A: { text: "実行したのは彼だし、自分は励ますことしかできない。", score: 0, effect: "AssistPoint = 0" },
            B: { text: "口を出した以上、自分にも責任がある。一緒に頭を下げる。", score: 3.0, effect: "Leadership += MAX" }
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

function showMatrixEffect(text, event) {
    const container = document.getElementById('matrix-container');
    const el = document.createElement('div');
    el.classList.add('matrix-effect');
    if (text.includes("Tax") || text.includes("Risk") || text.includes("Low")) {
        el.classList.add('negative');
    }
    el.innerText = text;

    // Position near the click or center if no event provided (though we pass event)
    const x = event.clientX;
    const y = event.clientY;

    // Adjust slightly so it doesn't block immediately or look weird
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    container.appendChild(el);

    // Remove after animation
    setTimeout(() => {
        el.remove();
    }, 1000);
}

function answerQuestion(choice, event) {
    const q = questions[currentStep];
    const option = q.options[choice];

    // Matrix Effect
    showMatrixEffect(option.effect, event);

    totalScore += option.score;
    answers.push(choice);

    // 少し待ってから次へ（エフェクトを見せるため）
    setTimeout(() => {
        currentStep++;
        if (currentStep < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 400); // 0.4秒待機
}

function showResult() {
    screenQuestion.classList.remove('active');
    screenResult.classList.add('active');

    document.getElementById('progress-fill').style.width = '100%';

    // 結果判定ロジック

    let resultType = "";
    let resultDesc = "";
    let roleCurrent = "";
    let salaryCurrent = "";
    let rolePotential = "";
    let salaryPotential = "";
    let lostProfit = "";

    const isQ1B = answers[0] === 'B';
    const isQ2B = answers[1] === 'B';
    const isQ3B = answers[2] === 'B';
    const isQ4B = answers[3] === 'B';
    // const isQ5B = answers[4] === 'B';

    if (totalScore >= 1.5) { // 高得点パターン (基準を下げる)
        if (isQ1B && isQ2B) {
            // パターン1：高スコアだが都会で消耗 (Hidden CFO)
            resultType = "『隠れCFO（最高財務責任者）猫』";
            roleCurrent = "協調性のない平社員";
            salaryCurrent = "450万円";
            rolePotential = "利益率を5%改善できる\n経営企画室長";
            salaryPotential = "1,200万円";
            lostProfit = "750万円";
            resultDesc = "あなたは一見「生意気」「理屈っぽい」と言われるかもしれませんが、経営視点はプロ経営者レベルです。安易な値引きを嫌い、無駄な残業を嫌うその姿勢は、正しい管理会計センスの塊です。<br><br>あなたの能力は、分業化された大都会の歯車では「ノイズ」扱いされますが、一人多役を求められる地方メーカーでは「救世主」になります。";
        } else {
            // 別パターンの高得点 (Silent Guardian / COO)
            resultType = "『沈黙の守護神（Hidden COO）猫』";
            roleCurrent = "口数の少ない作業員";
            salaryCurrent = "380万円";
            rolePotential = "工場を自動化する\n生産技術部長";
            salaryPotential = "1,000万円";
            lostProfit = "620万円";
            resultDesc = "あなたは派手なアピールを嫌いますが、誰よりも現場の「違和感」に気づく能力を持っています。トラブルを未然に消し去るその能力は、数字に表れにくいですが、実は数億円規模の損失を防いでいます。<br><br>地方メーカーは今、あなたの「予知能力」を喉から手が出るほど求めています。";
        }
    } else {
        // 標準〜低スコア (伸びしろ猫)
        resultType = "『未完の大器（Potential）猫』";
        roleCurrent = "普通の会社員";
        salaryCurrent = "400万円";
        rolePotential = "現場を改革する\n若手リーダー";
        salaryPotential = "650万円";
        lostProfit = "250万円";
        resultDesc = "あなたはまだ自分の武器に気づいていないかもしれません。しかし、ここぞという時の判断力には光るものがあります。あと少し「環境」を変えれば、バケる可能性があります。";
    }

    const formattedScore = (totalScore > 0 ? "+" : "") + totalScore.toFixed(2);

    // グローバル保存
    window.currentResultType = resultType;
    window.currentLostProfit = lostProfit;
    window.currentResultDesc = resultDesc.replace(/<br>/g, " ").replace(/<[^>]*>/g, "");

    // DOM更新
    document.getElementById('result-type').innerText = resultType;
    document.getElementById('result-score-value').innerText = formattedScore;
    document.getElementById('role-current').innerText = roleCurrent;
    document.getElementById('salary-current').innerText = salaryCurrent;
    document.getElementById('role-potential').innerText = rolePotential;
    // 改行を反映するためにHTMLで
    document.getElementById('role-potential').innerHTML = rolePotential.replace(/\n/g, '<br>');

    document.getElementById('salary-potential').innerText = salaryPotential;
    document.getElementById('lost-profit').innerText = lostProfit;
    document.getElementById('result-description').innerHTML = resultDesc;
}

function shareResult() {
    const score = (totalScore > 0 ? "+" : "") + totalScore.toFixed(2);
    const type = window.currentResultType || "診断結果";
    const lost = window.currentLostProfit || "不明";

    const text = `【Human WAR診断】\n私のスコア: ${score}\n判定: ${type}\n⚠️ 年間逸失利益: ${lost}\n\n「純粋な実力」と「本当の値段」を計算します。`;
    const url = "https://neko-soroban.vercel.app/diagnosis.html";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=HumanWAR診断,地方メーカー活躍論`;
    window.open(twitterUrl, '_blank');
}
