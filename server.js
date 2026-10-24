
const express = require("express");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
app.use(express.json());

let connection = null;
let liveStatus = "disconnected";
let recentGifts = [];
let currentUsername = "";

app.get("/", (req, res) => {
  res.json({
    name: "XynoStore Gift Bid Server",
    status: liveStatus,
    username: currentUsername,
    gifts: recentGifts
  });
});

app.get("/gifts", (req, res) => {
  res.json({
    status: liveStatus,
    username: currentUsername,
    gifts: recentGifts
  });
});

app.post("/connect", async (req, res) => {
  const username = String(req.body.username || "")
    .replace(/^@/, "")
    .trim();

  if (!username) {
    return res.status(400).json({
      error: "Masukkan username TikTok"
    });
  }

  try {
    if (connection) {
      try {
        await connection.disconnect();
      } catch (_) {}
    }

    currentUsername = username;
    recentGifts = [];
    liveStatus = "connecting";

    connection = new WebcastPushConnection(username);

    connection.on("gift", (data) => {
      if (data.giftType === 1 && data.repeatEnd === false) {
        return;
      }

      const gift = {
        username: data.nickname || data.uniqueId || "Penonton",
        giftName: data.giftName || "Gift",
        count: Number(data.repeatCount || 1),
        diamonds: Number(data.diamondCount || 0),
        time: new Date().toISOString()
      };

      recentGifts.unshift(gift);
      recentGifts = recentGifts.slice(0, 100);
    });

    connection.on("connected", () => {
      liveStatus = "connected";
    });

    connection.on("disconnected", () => {
      liveStatus = "disconnected";
    });

    connection.on("error", (error) => {
      liveStatus = "error";
      console.error("TikTok LIVE error:", error);
    });

    await connection.connect();

    res.json({
      ok: true,
      message: "Sambungan LIVE dimulakan",
      username
    });
  } catch (error) {
    liveStatus = "error";
    console.error(error);

    res.status(500).json({
      error: "Gagal menyambung LIVE. Pastikan akaun sedang LIVE."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`XynoStore server berjalan pada port ${PORT}`);
});
