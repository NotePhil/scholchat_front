const Minio = require("minio");
const dotenv = require("dotenv");

dotenv.config();

// Création du client Minio (compatible S3)
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Vérifier si le bucket existe, sinon le créer
const initBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(
      process.env.MINIO_BUCKET
    );

    if (!bucketExists) {
      console.log(
        `Bucket ${process.env.MINIO_BUCKET} does not exist, creating it...`
      );
      await minioClient.makeBucket(process.env.MINIO_BUCKET);

      // Configuration de la politique d'accès du bucket pour permettre la lecture publique
      // Vous pouvez ajuster cette politique selon vos besoins de sécurité
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${process.env.MINIO_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(
        process.env.MINIO_BUCKET,
        JSON.stringify(policy)
      );
      console.log(
        `Bucket ${process.env.MINIO_BUCKET} created successfully with public read access`
      );
    } else {
      console.log(`Bucket ${process.env.MINIO_BUCKET} already exists`);
    }
  } catch (error) {
    console.error("Error initializing bucket:", error);
    throw error;
  }
};

module.exports = {
  minioClient,
  initBucket,
};
