import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 🔥 Vercel ကို Edge Mode နဲ့ Run ခိုင်းခြင်း (အမြန်ဆုံးစနစ်)
export const config = {
  runtime: 'edge',
};

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(request) {
  // Edge Mode မှာ URL ကို ဒီလိုယူရပါတယ်
  const url = new URL(request.url);
  const file = url.searchParams.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "Filename missing" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file,
      // Browser မှာ တန်းပွင့်အောင်
      ResponseContentDisposition: `inline; filename="${file}"`,
      // Streaming ပိုမြန်အောင် Cache ဖမ်းခိုင်းမယ်
      ResponseCacheControl: "public, max-age=31536000",
    });

    // ၃ နာရီ (10800 seconds)
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 10800 });

    // 🔥 Redirect (307)
    // Edge ကနေ Redirect လုပ်တာမို့ အရမ်းမြန်ပါတယ်
    return Response.redirect(signedUrl, 307);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
