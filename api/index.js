// api/index.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 Setting (Environment Variables မှ ယူမည်)
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // URL ကနေ file name ကို ယူမယ်
  // ဥပမာ: /api?file=movie.mp4
  const { file } = req.query;

  if (!file) {
    return res.status(400).json({ error: "Filename is required. Usage: /api?file=yourvideo.mp4" });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file,
      // Inline ဆိုတာက Browser/App မှာ တန်းပွင့်အောင်ပါ (Download Box မပေါ်အောင်)
      ResponseContentDisposition: `inline; filename="${file}"`,
      ResponseCacheControl: "public, max-age=31536000",
    });

    // ၃ နာရီ (10800 စက္ကန့်) ခံမယ့် Link ထုတ်မယ်
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 10800 });

    // 🔥 အဓိကနေရာ (Redirect) 🔥
    // Vercel Bandwidth မကုန်စေဘဲ R2 Link အစစ်ဆီကို User ကို ပို့လိုက်တာပါ
    res.redirect(307, signedUrl);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
