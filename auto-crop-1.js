/**
 * 找出圖片中非背景顏色的邊界 (優化純 JS 版)
 * @param {ImageData} imageData - 來自 canvas.getContext('2d').getImageData 的物件
 * @param {number} thresholdPercent - 容差百分比 (例如 5.0)
 * @returns {number[]} [x, y, width, height]
 */
function findCropBoxJS(imageData, thresholdPercent) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 1. 取得背景色 (這裡採用最快的做法：直接取左上角。若需更嚴謹可改成取四個角的平均)
    const bgR = pixels[0];
    const bgG = pixels[1];
    const bgB = pixels[2];

    // 2. 預先計算平方容差值 (效能優化：避開 Math.sqrt)
    // 3D 空間最大距離平方 = 255^2 + 255^2 + 255^2 = 195075
    const MAX_DIST_SQ = 195075;
    const thresholdFraction = thresholdPercent / 100.0;
    // 必須將百分比先轉回相對的距離長度，再平方
    const thresholdSq = MAX_DIST_SQ * (thresholdFraction * thresholdFraction);

    // 定義檢查函數：利用平方和比較，省去開根號
    const isDifferent = (idx) => {
        const dr = pixels[idx] - bgR;
        const dg = pixels[idx + 1] - bgG;
        const db = pixels[idx + 2] - bgB;
        const distSq = (dr * dr) + (dg * dg) + (db * db);
        return distSq > thresholdSq;
    };

    let cropTop = 0;
    let cropBottom = 0;
    let cropLeft = 0;
    let cropRight = 0;

    // 1. 由上往下掃
    topLoop: for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (isDifferent((y * width + x) * 4)) break topLoop;
        }
        cropTop++;
    }

    if (cropTop === height) return [0, 0, width, height]; // 全圖皆為背景

    // 2. 由下往上掃
    bottomLoop: for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            if (isDifferent((y * width + x) * 4)) break bottomLoop;
        }
        cropBottom++;
    }

    // 3. 由左往右掃 (只掃未裁切掉的 Y 軸範圍)
    leftLoop: for (let x = 0; x < width; x++) {
        for (let y = cropTop; y < height - cropBottom; y++) {
            if (isDifferent((y * width + x) * 4)) break leftLoop;
        }
        cropLeft++;
    }

    // 4. 由右往左掃
    rightLoop: for (let x = width - 1; x >= 0; x--) {
        for (let y = cropTop; y < height - cropBottom; y++) {
            if (isDifferent((y * width + x) * 4)) break rightLoop;
        }
        cropRight++;
    }

    return [
        cropLeft, 
        cropTop, 
        width - cropLeft - cropRight, 
        height - cropTop - cropBottom
    ];
}
