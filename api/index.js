import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const { file } = req.query;

  if (!file) return res.status(400).send("Filename missing");

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file,
      ResponseContentDisposition: `inline; filename="${file}"`,
      ResponseCacheControl: "public, max-age=31536000",
    });

    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 10800 }); // 3 Hours
    res.redirect(307, signedUrl);
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}
