require('dotenv').config();
const SteamUser = require('steam-user');
const mongoose = require('mongoose');
const express = require('express');
const stringSimilarity = require('string-similarity');
const axios = require('axios');

// SERVER
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('Bot 7/24 Calisiyor! 🚀'); });
app.listen(PORT, () => { console.log(`✅ Web Server Port: ${PORT}`); });

// CONFIG & DB
const client = new SteamUser();
const ADMIN_ID = "76561198392007368"; // Admin ID
const config = { accountName: process.env.STEAM_USER, password: process.env.STEAM_PASS };
const DB_URI = process.env.DB_URI;

mongoose.connect(DB_URI)
    .then(() => console.log('✅ Veritabanı Bağlandı'))
    .catch(err => console.log('❌ DB Hatası:', err));

// SCHEMA
const PlayerSchema = new mongoose.Schema({
    steamID: { type: String, unique: true },
    name: { type: String, sparse: true },
    crosshair: String,
    myCrosshairs: [{ label: String, code: String }],
    language: { type: String, default: 'tr' },
    languageSelected: { type: Boolean, default: false },
    activeGame: { name: String, board: [String], turn: String, target: String, guesses: [String] }
}, { strict: false });
const Player = mongoose.model('Player', PlayerSchema);

// CONSTANTS
const CROSSHAIR_LIMIT = 10;
const START_MSG = `🤖 **NodeCS | CS2 COMPANION** 🤖

🇹🇷 **HOŞGELDİNİZ!**
𝗡𝗼𝗱𝗲.𝗰𝘀 sayesinde crosshairlarınızı kaydedebilir, pro oyuncuların ayarlarını bulabilir ve oyuncu analizi yapabilirsiniz.
👉 Başlamak için dil seçiniz: **!tr**

━━━━━━━━━━━━━━━━━━━━━

🇬🇧 **WELCOME!**
With 𝗡𝗼𝗱𝗲.𝗰𝘀, you can save your crosshairs, find pro player settings, and analyze players.
👉 Select language to start: **!en**`;

// LOCALES
const LOCALES = {
    tr: {
        welcome_final: "✅ Dil **Türkçe** olarak ayarlandı!\nArtık botu kullanabilirsin.\nMenü için: !help",
        lang_set: "✅ Dil **Türkçe** olarak değiştirildi.",
        locked: "⛔ Dil seçimi kilitlendi! Değiştiremezsin.",
        help_header: "🤖 **CS2 ASİSTAN MENÜSÜ** 🤖\n━━━━━━━━━━━━━━━━━━━━━\n",
        help_desc: { check: "Faceit & Leetify analizi yap.", minigames: "Oyun menüsünü aç.", cross: "Pro oyuncu veya kayıtlı cross bul.", add: "Crosshair kaydet.", del: "Kayıtlı crosshair sil.", list: "Kaydettiğin listeyi gör." },
        err_link: "❌ Hatalı Link! Örn: steamcommunity.com/id/...",
        err_not_found: "🚫 Bulunamadı.",
        err_exists: "⛔ Bu isimde bir PRO oyuncu var!",
        err_limit: `⛔ Kota Dolu (Maksimum ${CROSSHAIR_LIMIT})`,
        err_code: "⚠️ Kod 'CSGO-' ile başlamalıdır!",
        success_add: "💾 Başarıyla Kaydedildi!",
        success_del: "🗑️ Başarıyla Silindi.",
        success_upd: "✅ Güncellendi!",
        admin_err: "⛔ Yetkisiz İşlem!",
        games_menu: "🎮 **OYUNLAR** 🎮\n━━━━━━━━━━\n⭕ **!xox**\n   ↳ Bot ile Tic-Tac-Toe.\n   Başlat: !xox start\n   Hamle: !xox 1-9\n\n🔤 **!wordle**\n   ↳ CS2 Kelime Tahmini.\n   Başlat: !wordle start\n   Tahmin: !wordle <kelime>\n",
        xox: { start: "🎮 **XOX BAŞLADI!**\nSen: ❌ vs Bot: ⭕\n1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣\nHamle: !xox 1-9", resume: "🔄 **OYUN DEVAM EDİYOR!**\nSıra sende: !xox 1-9", invalid: "⛔ Geçersiz hamle!", win: "🎉 **KAZANDIN!** 🏆", draw: "🤝 **BERABERE!**", lose: "🤖 **BEN KAZANDIM!**", turn: "👉 **Sıra sende!**", no_game: "⚠️ Oyun yok. Başlat: !xox start" },
        wordle: { start: "🔤 **WORDLE CS2 BAŞLADI!**", resume: "🔄 **OYUN DEVAM EDİYOR!**", guess_cmd: "Tahmin: !wordle <KELIME>", len_err: "⚠️ Kelime uzunluğu yanlış!", win: "🎉 **TEBRİKLER! BİLDİN!**", lose: "💀 **KAYBETTİN!**", guesses: "📋 **Tahminler:**", left: "Kalan Hak:", no_game: "⚠️ Oyun yok. Başlat: !wordle start" },
        analiz: { title: "📊 **OYUNCU ANALİZİ**", player: "Oyuncu", status: "Durum", premier: "PREMIER", score: "SKOR", matches: "Maç", st_trust: "🟢 GÜVENİLİR", st_sus: "⚠️ ŞÜPHELİ", st_ban: "⛔ YASAKLI", st_risk: "🚨 RİSKLİ", st_mm: "⚪ SADECE MM", st_unknown: "❓ BİLİNMİYOR", comm_cheat: "Hile?", comm_elite: "Seçkin", comm_good: "İyi", comm_mid: "Orta", comm_bad: "Kötü" }
    },
    en: {
        welcome_final: "✅ Language set to **English**!\nYou can now use the bot.\nFor menu: !help",
        lang_set: "✅ Language switched to **English**.",
        locked: "⛔ Language selection is locked! You cannot change it.",
        help_header: "🤖 **CS2 ASSISTANT MENU** 🤖\n━━━━━━━━━━━━━━━━━━━━━\n",
        help_desc: { check: "Faceit & Leetify analysis.", minigames: "Open games menu.", cross: "Find pro or saved crosshair.", add: "Save crosshair.", del: "Delete saved crosshair.", list: "View your list." },
        err_link: "❌ Invalid Link!",
        err_not_found: "🚫 Not Found.",
        err_exists: "⛔ Name taken by PRO player!",
        err_limit: `⛔ Limit Reached (${CROSSHAIR_LIMIT})`,
        err_code: "⚠️ Code must start with 'CSGO-'!",
        success_add: "💾 Saved!",
        success_del: "🗑️ Deleted.",
        success_upd: "✅ Updated!",
        admin_err: "⛔ Unauthorized!",
        games_menu: "🎮 **GAMES MENU** 🎮\n━━━━━━━━━━\n⭕ **!xox**\n   ↳ Tic-Tac-Toe.\n   Start: !xox start\n   Move: !xox 1-9\n\n🔤 **!wordle**\n   ↳ Guess CS2 Word.\n   Start: !wordle start\n   Guess: !wordle <word>\n",
        xox: { start: "🎮 **XOX STARTED!**\nYou: ❌ vs Bot: ⭕\n1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣\nMove: !xox 1-9", resume: "🔄 **GAME IN PROGRESS!**\nYour turn: !xox 1-9", invalid: "⛔ Invalid move!", win: "🎉 **YOU WON!** 🏆", draw: "🤝 **DRAW!**", lose: "🤖 **I WON!**", turn: "👉 **Your turn!**", no_game: "⚠️ No active game. Start: !xox start" },
        wordle: { start: "🔤 **WORDLE CS2 STARTED!**", resume: "🔄 **GAME IN PROGRESS!**", guess_cmd: "Guess: !wordle <WORD>", len_err: "⚠️ Wrong length!", win: "🎉 **YOU WON!**", lose: "💀 **GAME OVER!**", guesses: "📋 **Guesses:**", left: "Left:", no_game: "⚠️ No active game. Start: !wordle start" },
        analiz: { title: "📊 **PLAYER ANALYSIS**", player: "Player", status: "Status", premier: "PREMIER", score: "SCORE", matches: "Matches", st_trust: "🟢 TRUSTED", st_sus: "⚠️ SUSPICIOUS", st_ban: "⛔ BANNED", st_risk: "🚨 HIGH RISK", st_mm: "⚪ MM PLAYER", st_unknown: "❓ UNKNOWN", comm_cheat: "Cheater?", comm_elite: "Elite", comm_good: "Good", comm_mid: "Mid", comm_bad: "Bad" }
    }
};

// GAME LOGIC
const WIN_COMBOS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function checkWin(b, p) { return WIN_COMBOS.some(c => c.every(i => b[i] === p)); }
function getBotMove(b) {
    for (let c of WIN_COMBOS) { const [x, y, z] = c; if (b[x] == 'O' && b[y] == 'O' && !b[z]) return z; if (b[x] == 'O' && b[z] == 'O' && !b[y]) return y; if (b[y] == 'O' && b[z] == 'O' && !b[x]) return x; }
    for (let c of WIN_COMBOS) { const [x, y, z] = c; if (b[x] == 'X' && b[y] == 'X' && !b[z]) return z; if (b[x] == 'X' && b[z] == 'X' && !b[y]) return y; if (b[y] == 'X' && b[z] == 'X' && !b[x]) return x; }
    const empty = b.map((v, i) => v === null ? i : null).filter(v => v !== null);
    return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : -1;
}
function renderBoard(b) {
    const s = b.map(v => v === 'X' ? '❌' : (v === 'O' ? '⭕' : '⬜'));
    return `\n${s[0]} ${s[1]} ${s[2]}\n${s[3]} ${s[4]} ${s[5]}\n${s[6]} ${s[7]} ${s[8]}`;
}
function getWordleFeedback(guess, target) {
    let result = "";
    for (let i = 0; i < target.length; i++) {
        if (guess[i] === target[i]) result += "🟩 "; else if (target.includes(guess[i])) result += "🟨 "; else result += "⬛ ";
    }
    return result;
}

// MESSAGE QUEUE
const msgQueue = [];
let isProcessingQueue = false;
function sendSafeMessage(steamID, msg) { msgQueue.push({ steamID, msg }); processQueue(); }
function processQueue() {
    if (isProcessingQueue || msgQueue.length === 0) return;
    isProcessingQueue = true;
    const nextMsg = msgQueue.shift();
    try { client.chatTyping(nextMsg.steamID); } catch (e) { }
    setTimeout(() => { try { client.chatMessage(nextMsg.steamID, nextMsg.msg); } catch (err) { console.log("❌ Mesaj Hatası:", err); } isProcessingQueue = false; processQueue(); }, 2500);
}

// BOT EVENTS
client.logOn(config);
client.on('loggedOn', () => { console.log('✅ Bot Online!'); client.setPersona(SteamUser.EPersonaState.Online); });
client.on('friendRelationship', (steamID, relationship) => {
    const steamIDString = steamID.getSteamID64();
    if (relationship === SteamUser.EFriendRelationship.RequestRecipient) { client.addFriend(steamID); sendSafeMessage(steamIDString, START_MSG); }
    else if (relationship === SteamUser.EFriendRelationship.None) { Player.findOneAndDelete({ steamID: steamIDString }).catch(e => console.log(e)); }
});

// MESSAGE HANDLER
client.on('friendMessage', async (senderID, message) => {
    try {
        const msg = message.trim();
        if (!msg.startsWith('!')) return;
        const senderIDString = senderID.getSteamID64();
        const args = msg.split(' ');
        const command = args[0].toLowerCase().substring(1);

        let user = await Player.findOne({ steamID: senderIDString });
        if (!user) { user = new Player({ steamID: senderIDString, myCrosshairs: [], language: 'tr', languageSelected: false }); await user.save(); }

        if (!user.languageSelected && senderIDString !== ADMIN_ID) {
            if (command === 'tr') { await Player.findOneAndUpdate({ steamID: senderIDString }, { language: 'tr', languageSelected: true }); sendSafeMessage(senderIDString, LOCALES.tr.welcome_final); return; }
            else if (command === 'en') { await Player.findOneAndUpdate({ steamID: senderIDString }, { language: 'en', languageSelected: true }); sendSafeMessage(senderIDString, LOCALES.en.welcome_final); return; }
            else { sendSafeMessage(senderIDString, START_MSG); return; }
        }

        const userLang = user.language || 'tr';
        const LANG = LOCALES[userLang] || LOCALES.tr;

        if (command === 'tr' || command === 'en') {
            if (user.languageSelected && senderIDString !== ADMIN_ID) { sendSafeMessage(senderIDString, LANG.locked); return; }
            await Player.findOneAndUpdate({ steamID: senderIDString }, { language: command, languageSelected: true }); sendSafeMessage(senderIDString, command === 'tr' ? LOCALES.tr.lang_set : LOCALES.en.lang_set); return;
        }

        if (command === 'help') {
            let h = LANG.help_header;
            h += `🕵️‍♂️ **!check <link>**\n   ↳ ${LANG.help_desc.check}\n\n🎮 **!minigames**\n   ↳ ${LANG.help_desc.minigames}\n\n🎯 **!cross <name>**\n   ↳ ${LANG.help_desc.cross}\n\n➕ **!add <name> <code>**\n   ↳ ${LANG.help_desc.add}\n\n🗑️ **!delete <name>**\n   ↳ ${LANG.help_desc.del}\n\n📂 **!crosslist**\n   ↳ ${LANG.help_desc.list}`;
            if (senderIDString === ADMIN_ID) h += `\n\n👑 **ADMIN:** !adminadd, !admindelete`;
            sendSafeMessage(senderIDString, h); return;
        }

        if (command === 'minigames') { sendSafeMessage(senderIDString, LANG.games_menu); return; }

        if (command === 'xox') {
            const action = args[1]?.toLowerCase();
            if (!action) {
                if (user.activeGame && user.activeGame.name === 'xox') sendSafeMessage(senderIDString, renderBoard(user.activeGame.board) + "\n" + LANG.xox.resume);
                else { const newGame = { name: 'xox', board: Array(9).fill(null), turn: 'user' }; await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: newGame }); sendSafeMessage(senderIDString, LANG.xox.start); }
                return;
            }
            if (action === 'start') { const newGame = { name: 'xox', board: Array(9).fill(null), turn: 'user' }; await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: newGame }); sendSafeMessage(senderIDString, LANG.xox.start); return; }
            if (user.activeGame && user.activeGame.name === 'xox' && !isNaN(action)) {
                let move = parseInt(action) - 1;
                if (move < 0 || move > 8 || user.activeGame.board[move] !== null) { sendSafeMessage(senderIDString, LANG.xox.invalid); return; }
                let board = user.activeGame.board; board[move] = 'X';
                if (checkWin(board, 'X')) { await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: null }); sendSafeMessage(senderIDString, renderBoard(board) + "\n" + LANG.xox.win); return; }
                if (!board.includes(null)) { await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: null }); sendSafeMessage(senderIDString, renderBoard(board) + "\n" + LANG.xox.draw); return; }
                const bm = getBotMove(board); board[bm] = 'O';
                if (checkWin(board, 'O')) { await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: null }); sendSafeMessage(senderIDString, renderBoard(board) + "\n" + LANG.xox.lose); return; }
                await Player.findOneAndUpdate({ steamID: senderIDString }, { 'activeGame.board': board }); sendSafeMessage(senderIDString, renderBoard(board) + "\n" + LANG.xox.turn); return;
            }
            sendSafeMessage(senderIDString, LANG.xox.no_game); return;
        }

        if (command === 'wordle') {
            const action = args[1]?.toUpperCase();
            const WORD_SOURCE_URL = process.env.WORD_SOURCE_URL;
            const BACKUP_WORDS = ["MIRAGE", "INFERNO", "ANUBIS", "AK47", "AWP", "S1MPLE", "DONK"];

            const startWordle = async () => {
                let randomWord = "";
                try { if (!WORD_SOURCE_URL) throw new Error(); const res = await axios.get(WORD_SOURCE_URL, { timeout: 3000 }); const w = res.data.split('\n').map(x => x.trim().toUpperCase()).filter(x => x.length > 0); randomWord = w[Math.floor(Math.random() * w.length)]; }
                catch (e) { randomWord = BACKUP_WORDS[Math.floor(Math.random() * BACKUP_WORDS.length)]; }
                await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: { name: 'wordle', target: randomWord, guesses: [] } });
                sendSafeMessage(senderIDString, `${LANG.wordle.start}\n\n${"⬜ ".repeat(randomWord.length)}\n(${randomWord.length} ${LANG.wordle.letters})\n${LANG.wordle.guess_cmd}`);
            };

            if (!action) {
                if (user.activeGame && user.activeGame.name === 'wordle') sendSafeMessage(senderIDString, `${LANG.wordle.resume}\n\n${user.activeGame.guesses.join('\n') || "..."}\n\n${LANG.wordle.left} ${6 - user.activeGame.guesses.length}`);
                else await startWordle();
                return;
            }
            if (action === 'START') { await startWordle(); return; }
            if (user.activeGame && user.activeGame.name === 'wordle') {
                const target = user.activeGame.target; const guess = action;
                if (guess.length !== target.length) { sendSafeMessage(senderIDString, LANG.wordle.len_err); return; }
                const newGuess = `${guess} -> ${getWordleFeedback(guess, target)}`;
                let currentGuesses = user.activeGame.guesses; currentGuesses.push(newGuess);
                if (guess === target || currentGuesses.length >= 6) { await Player.findOneAndUpdate({ steamID: senderIDString }, { activeGame: null }); sendSafeMessage(senderIDString, (guess === target ? LANG.wordle.win : LANG.wordle.lose) + `\n**${target}**\n\n` + currentGuesses.join('\n')); return; }
                await Player.findOneAndUpdate({ steamID: senderIDString }, { 'activeGame.guesses': currentGuesses });
                sendSafeMessage(senderIDString, `${LANG.wordle.guesses}\n${currentGuesses.join('\n')}\n\n${LANG.wordle.left} ${6 - currentGuesses.length}`); return;
            }
            sendSafeMessage(senderIDString, LANG.wordle.no_game); return;
        }
        //CHECK
        if (command === 'check') {
            const steamLink = args[1];
            if (!steamLink || !steamLink.includes('steamcommunity.com')) { sendSafeMessage(senderIDString, LANG.err_link); return; }
            try {
                sendSafeMessage(senderIDString, "🔄 ...");
                const xmlUrl = steamLink.endsWith('/') ? `${steamLink}?xml=1` : `${steamLink}/?xml=1`;
                const steamResp = await axios.get(xmlUrl, { timeout: 7000 });
                const steamIdMatch = steamResp.data.match(/<steamID64>(\d+)<\/steamID64>/);
                if (!steamIdMatch) { sendSafeMessage(senderIDString, LANG.err_not_found); return; }
                const targetSteamID = steamIdMatch[1];

                let fData = { found: false, level: '-', elo: '-', kd: '-', matches: '-', banMsg: '', isBanned: false };
                let nickname = "Player";
                try {
                    const fPlayer = await axios.get(`https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${targetSteamID}`, { headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }, timeout: 5000 });
                    nickname = fPlayer.data.nickname;
                    const fBans = await axios.get(`https://open.faceit.com/data/v4/players/${fPlayer.data.player_id}/bans`, { headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }, timeout: 5000 });
                    const fStats = await axios.get(`https://open.faceit.com/data/v4/players/${fPlayer.data.player_id}/stats/cs2`, { headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }, timeout: 5000 });
                    fData.found = true; fData.level = fPlayer.data.games.cs2.skill_level; fData.elo = fPlayer.data.games.cs2.faceit_elo; fData.kd = fStats.data.lifetime["Average K/D Ratio"]; fData.matches = fStats.data.lifetime["Matches"];
                    if (fBans.data.items.length > 0) { fData.isBanned = true; fData.banMsg = fBans.data.items[0].reason.toUpperCase(); }
                } catch (e) { }

                let lData = { found: false, rating: 'N/A', rawRating: -99, premier: 'Unranked', aim: 'N/A', util: 'N/A', pos: 'N/A', skillComment: 'N/A' };
                try {
                    const lResp = await axios.get(`https://api-public.cs-prod.leetify.com/v3/profile?id=${targetSteamID}`, { headers: { '_leetify_key': process.env.LEETIFY_API_KEY }, timeout: 7000 });
                    const d = lResp.data;
                    if (d) {
                        if (!fData.found && d.meta) nickname = d.meta.name;
                        if (d.ranks) {
                            lData.found = true;
                            if (d.ranks.premier) lData.premier = `${d.ranks.premier} Rating`; else if (d.ranks.skillLevel) lData.premier = `${d.ranks.skillLevel} Rating`;
                            if (d.ranks.leetify !== undefined) {
                                const sc = parseFloat(d.ranks.leetify);
                                lData.rawRating = sc; lData.rating = (sc > 0 ? "+" : "") + sc.toFixed(2);
                                if (sc >= 4.0) lData.skillComment = LANG.analiz.comm_cheat;
                                else if (sc >= 2.0) lData.skillComment = LANG.analiz.comm_elite;
                                else if (sc >= 0.5) lData.skillComment = LANG.analiz.comm_good;
                                else if (sc >= -1.0) lData.skillComment = LANG.analiz.comm_mid;
                                else lData.skillComment = LANG.analiz.comm_bad;
                            }
                        }
                        if (d.ratings) { if (d.ratings.aim) lData.aim = Math.round(d.ratings.aim); if (d.ratings.utility) lData.util = Math.round(d.ratings.utility); if (d.ratings.positioning) lData.pos = Math.round(d.ratings.positioning); }
                    }
                } catch (e) { }

                let statusLine = LANG.analiz.st_trust;
                if (fData.isBanned) statusLine = `${LANG.analiz.st_ban} (${fData.banMsg})`;
                else if (lData.found && lData.rawRating > 5.0) statusLine = `${LANG.analiz.st_risk} (Leetify: ${lData.rating})`;
                else if (lData.found && lData.rawRating > 3.0) statusLine = `${LANG.analiz.st_sus} (High Rating)`;
                else if (fData.found) { const m = parseInt(fData.matches); const k = parseFloat(fData.kd); if (m < 50 && k > 1.80) statusLine = LANG.analiz.st_risk; }
                else if (!fData.found && lData.found) statusLine = LANG.analiz.st_mm;
                else if (!fData.found && !lData.found) statusLine = LANG.analiz.st_unknown;

                let rep = `${LANG.analiz.title}\n${LANG.analiz.player}: ${nickname}\n🛡️ ${LANG.analiz.status}: ${statusLine}\n────────────────\n`;
                if (fData.found) rep += `🏆 FACEIT: Lvl ${fData.level} (${fData.elo})\n🔫 K/D: ${fData.kd}  ${LANG.analiz.matches}: ${fData.matches}\n`; else rep += `❌ FACEIT: -\n`;
                if (lData.found) { rep += `🎖️ ${LANG.analiz.premier}: ${lData.premier}\n🧠 ${LANG.analiz.score}: ${lData.rating} (${lData.skillComment})\n`; if (lData.aim !== 'N/A') rep += `🎯 AIM: ${lData.aim}  💣 UTIL: ${lData.util}  📍 POS: ${lData.pos}\n`; } else { rep += `❌ LEETIFY: -\n`; }
                rep += `────────────────\n🔗 Faceit: https://faceit.com/en/players/${nickname}\n`;
                if (lData.found || !fData.found) rep += `🔗 Leetify: https://leetify.com/app/profile/${targetSteamID}`;
                sendSafeMessage(senderIDString, rep);
            } catch (error) { sendSafeMessage(senderIDString, "⚠️ Error / Hata"); }
            return;
        }

        if (command === 'add') {
            const label = args[1]?.toLowerCase(); const code = args[2];
            if (!label || !code || !code.startsWith('CSGO-')) { sendSafeMessage(senderIDString, `❌ ${LANG.help_desc.add}`); return; }
            const isPro = await Player.findOne({ name: label }); if (isPro) { sendSafeMessage(senderIDString, LANG.err_exists); return; }
            const idx = user.myCrosshairs.findIndex(c => c.label === label);
            if (idx !== -1) { user.myCrosshairs[idx].code = code; await user.save(); sendSafeMessage(senderIDString, LANG.success_upd); }
            else { if (user.myCrosshairs.length >= CROSSHAIR_LIMIT) { sendSafeMessage(senderIDString, LANG.err_limit); return; } user.myCrosshairs.push({ label, code }); await user.save(); sendSafeMessage(senderIDString, LANG.success_add); }
        }
        else if (command === 'delete') {
            const label = args[1]?.toLowerCase(); if (!label) { sendSafeMessage(senderIDString, `❌ ${LANG.help_desc.del}`); return; }
            const init = user.myCrosshairs.length; user.myCrosshairs = user.myCrosshairs.filter(c => c.label !== label);
            if (user.myCrosshairs.length < init) { await user.save(); sendSafeMessage(senderIDString, LANG.success_del); } else sendSafeMessage(senderIDString, LANG.err_not_found);
        }
        else if (command === 'crosslist') {
            if (user.myCrosshairs.length > 0) { let l = "📂 **LIST:**\n"; user.myCrosshairs.forEach(c => l += `🔹 ${c.label} : ${c.code}\n`); sendSafeMessage(senderIDString, l); } else sendSafeMessage(senderIDString, "📭 " + LANG.err_not_found);
        }
        else if (command === 'cross') {
            const searchName = args[1]?.toLowerCase(); if (!searchName) { sendSafeMessage(senderIDString, `❌ ${LANG.help_desc.cross}`); return; }
            const pro = await Player.findOne({ name: searchName }); if (pro) { sendSafeMessage(senderIDString, `⭐ **${pro.name.toUpperCase()}:**\n${pro.crosshair}`); return; }
            const p = user.myCrosshairs.find(c => c.label === searchName); if (p) { sendSafeMessage(senderIDString, `👤 **${p.label}:**\n${p.code}`); return; }
            const all = await Player.find({ name: { $exists: true } }, 'name').limit(500);
            if (all.length > 0) { const match = stringSimilarity.findBestMatch(searchName, all.map(p => p.name)); if (match.bestMatch.rating > 0.4) { const s = await Player.findOne({ name: match.bestMatch.target }); sendSafeMessage(senderIDString, `🤔 **${s.name.toUpperCase()}?**\n${s.crosshair}`); } else sendSafeMessage(senderIDString, LANG.err_not_found); }
        }
        else if (command === 'adminadd' && senderIDString === ADMIN_ID) { const pName = args[1]?.toLowerCase(); const pCode = args[2]; if (pName && pCode) { await Player.findOneAndUpdate({ name: pName }, { crosshair: pCode }, { upsert: true }); sendSafeMessage(senderIDString, "👑 Saved."); } }
        else if (command === 'admindelete' && senderIDString === ADMIN_ID) { const pName = args[1]?.toLowerCase(); if (pName) { await Player.findOneAndDelete({ name: pName }); sendSafeMessage(senderIDString, "🗑️ Deleted."); } }
        else if (command === 'ping') sendSafeMessage(senderIDString, "🏓 Pong!");

    } catch (fatalError) { console.error("CRASH PREVENTED:", fatalError); sendSafeMessage(senderIDString, "⚠️ System Error."); }
});