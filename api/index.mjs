import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 🔥 ၁။ ဒီစာကြောင်းက အရေးအကြီးဆုံးပါ (Server ကို Edge Mode ပြောင်းလိုက်တာပါ)
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

// Edge Runtime မှာ req, res အစား Standard Request ကို သုံးရပါတယ်
export default async function handler(request) {
  const url = new URL(request.url);
  const file = url.searchParams.get('file');

  if (!file) {
    return new Response("Filename missing", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file,
      // Browser မှာ တန်းပွင့်အောင် inline ထားပါတယ်
      ResponseContentDisposition: `inline; filename="${file}"`,
      // Speed ကောင်းအောင် Cache ဖမ်းခိုင်းထားပါတယ်
      ResponseCacheControl: "public, max-age=31536000",
    });

    // ၃ နာရီခံတဲ့ Link ထုတ်မယ်
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 10800 });

    // 🔥 Redirect (Standard Web API) 🔥
    return Response.redirect(signedUrl, 307);

  } catch (error) {
    return new Response("Error: " + error.message, { status: 500 });
  }
}
