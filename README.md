# 🤖 NodeCS | CS2 Companion Bot

NodeCS, Counter-Strike 2 oyuncuları için geliştirilmiş; oyuncu analizi yapan, crosshair kodlarını saklayan ve mini oyunlar içeren kapsamlı bir Steam Chat botudur.

## 🌟 Özellikler

* **🕵️‍♂️ Oyuncu Analizi (`!check`):** Faceit ve Leetify API'larını kullanarak oyuncuların güvenilirlik durumunu, K/D oranını ve yetenek seviyesini analiz eder.
* **🎯 Crosshair Yönetimi:** Pro oyuncuların crosshair kodlarını bulur veya kendi kodlarınızı saklar (`!cross`, `!add`).
* **🎮 Mini Oyunlar:** Arkadaşlarınızla veya botla oynayabileceğiniz XOX ve Wordle (CS2 kelimeleriyle) oyunları.
* **🌍 Çoklu Dil Desteği:** Türkçe ve İngilizce dil seçeneği.

## 🚀 Teknolojiler

* **Node.js**
* **steam-user** (Steam Ağı Bağlantısı)
* **MongoDB** (Veri Saklama)
* **Faceit & Leetify API** (Veri Çekme)

## 📦 Kurulum

1. Repoyu klonlayın.
2. `npm install` ile paketleri yükleyin.
3. `.env` dosyasını oluşturup gerekli API anahtarlarını girin.
4. `node bot.js` ile başlatın.