const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.8;

export const resizeImageToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("Image must be smaller than 5MB"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round(
              (height * MAX_DIMENSION) / width
            );
            width = MAX_DIMENSION;
          } else {
            width = Math.round(
              (width * MAX_DIMENSION) / height
            );
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };

      img.onerror = () => {
        reject(new Error("Could not load image"));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Could not read image file"));
    };

    reader.readAsDataURL(file);
  });
