package com.juggleim;

import android.content.ContentResolver;
import android.content.Context;
import android.net.Uri;
import android.util.Log;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FileUtils {
    public static String convertContentUriToFile(Context context, String contentUri) {
        if (!contentUri.startsWith("content://")) {
            return contentUri;
        }
        InputStream inputStream = null;
        OutputStream outputStream = null;
        File tempFile = null;

        try {
            // 获取 ContentResolver
            ContentResolver resolver = context.getContentResolver();

            // 获取输入流
            inputStream = resolver.openInputStream(Uri.parse(contentUri));

            // 创建临时文件
            tempFile = new File(context.getCacheDir(), System.currentTimeMillis() + "temp_image.jpg");
            if (tempFile.exists()) {
                tempFile.delete(); // 如果文件存在，删除它
            }

            // 写入文件
            outputStream = new FileOutputStream(tempFile);
            byte[] buffer = new byte[1024];
            int length;
            while ((length = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }
            outputStream.flush();
        } catch (Exception e) {
            Log.e("FileUtils", "Error converting content Uri to file", e);
        } finally {
            // 关闭流
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (Exception e) {
                Log.e("FileUtils", "Error closing streams", e);
            }
        }
        return tempFile.getAbsolutePath();
    }

    /**
     * 删除临时文件
     */
    public static boolean deleteTempFile(File tempFile) {
        if (tempFile != null && tempFile.exists()) {
            return tempFile.delete();
        }
        return false;
    }

    /**
     * create temp file
     *
     * @param context
     * @return
     * @throws IOException
     */
    public static Uri createTmpImageFile(Context context) {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = context.getCacheDir();
        try {
            File photoFile = File.createTempFile(
                    imageFileName,
                    ".jpg",
                    storageDir
            );
            // Use packageName + ".fileprovider" so it matches the authority declared in AndroidManifest
            String authority = context.getPackageName() + ".fileprovider";
            Uri photoURI = FileProvider.getUriForFile(context, authority, photoFile);
            return photoURI;
        } catch (Exception e) {
            Log.e("FileUtils", "Error creating temp file", e);
            throw new RuntimeException(e);
        }
    }

}
