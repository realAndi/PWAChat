import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

interface ImageExtractorProps {
  file: File;
  onExtract: (colors: string[], imagePiece: string, qrCodeData: string) => void;
}

const ticketColors: { [key: string]: [number, number, number] } = {
    Yellow: [255, 223, 57],
    Blue: [59, 134, 254],
    Green: [97, 175, 97],
    Pink: [254, 206, 212],
    Red: [248, 97, 100], 
    Purple: [186, 137, 191],
    Gray: [155, 155, 155],
};


const colorThreshold = 5; // Margin of error for color matching

const getColorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
  return Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
  );
};


const ImageExtractor: React.FC<ImageExtractorProps> = ({ file, onExtract }) => {
    const [loading, setLoading] = useState(false);
    const topCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const bottomCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const remainderTopCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const qrCodeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
  
    const extractColorsAndPiece = async (file: File) => {
      setLoading(true);
      try {
        const image = new Image();
        const reader = new FileReader();
  
        reader.onload = (event) => {
          if (event.target?.result) {
            image.src = event.target.result as string;
            setImageSrc(event.target.result as string);
          }
        };
  
        image.onload = () => {
          const topCanvas = topCanvasRef.current;
          const bottomCanvas = bottomCanvasRef.current;
          const remainderTopCanvas = remainderTopCanvasRef.current;
          const qrCodeCanvas = qrCodeCanvasRef.current;
          if (!topCanvas || !bottomCanvas || !remainderTopCanvas || !qrCodeCanvas) return;
          const topCtx = topCanvas.getContext('2d');
          const bottomCtx = bottomCanvas.getContext('2d');
          const remainderTopCtx = remainderTopCanvas.getContext('2d');
          const qrCodeCtx = qrCodeCanvas.getContext('2d');
          if (!topCtx || !bottomCtx || !remainderTopCtx || !qrCodeCtx) {
            throw new Error('Canvas context not available');
          }
  
          // In the image processing section
          const halfHeight = Math.floor(image.height / 2);
          const scanHeight = Math.floor(halfHeight * 0.15); // Bottom 25% of the top half

          // Set canvas dimensions for top half
          topCanvas.width = image.width;
          topCanvas.height = scanHeight;  // Reduced height

          // Draw the image - adjust the source position to get the right part
          topCtx.drawImage(
              image,
              0,                          // source x
              halfHeight - scanHeight,    // source y
              image.width,                // source width
              scanHeight,              // source height - only take 60%
              0,                          // dest x
              0,                          // dest y
              image.width,                // dest width
              scanHeight               // dest height
          );
  
          const isWhite = (r: number, g: number, b: number): boolean => {
            return r > 220 && g > 220 && b > 220;
          };

          const isBlack = (r: number, g: number, b: number): boolean => {
            return r < 60 && g < 60 && b < 60;
          };
          
          // // In the image processing section, after getting the image data:
          const topImageData = topCtx.getImageData(0, 0, topCanvas.width, topCanvas.height);
          const topData = topImageData.data;
          
          // Remove white and black pixels
          for (let i = 0; i < topData.length; i += 4) {
              if (isWhite(topData[i], topData[i + 1], topData[i + 2])) {
                  topData[i + 3] = 0; // Set alpha to 0 (transparent)
              }
              if (isBlack(topData[i], topData[i + 1], topData[i + 2])) {
                topData[i + 3] = 0; // Set alpha to 0 (transparent)
            } 
          }

        
          // // Put the modified image data back
          topCtx.putImageData(topImageData, 0, 0);
  
          const getSampleColor = (x: number, y: number, data: Uint8ClampedArray, width: number, sampleSize: number = 5) => {
            let rTotal = 0, gTotal = 0, bTotal = 0;
            let validSamples = 0;
        
            // Sample a 5x5 (or sampleSize x sampleSize) area around the point
            for (let dy = -Math.floor(sampleSize/2); dy <= Math.floor(sampleSize/2); dy++) {
                for (let dx = -Math.floor(sampleSize/2); dx <= Math.floor(sampleSize/2); dx++) {
                    const newY = y + dy;
                    const newX = x + dx;
                    
                    // Skip if outside canvas bounds
                    if (newX < 0 || newY < 0 || newX >= width || newY >= topCanvas.height) continue;
                    
                    const i = (newY * width + newX) * 4;
                    
                    // Skip transparent pixels
                    if (data[i + 3] === 0) continue;
                    
                    rTotal += data[i];
                    gTotal += data[i + 1];
                    bTotal += data[i + 2];
                    validSamples++;
                }
            }
        
            // Return null if no valid samples found
            if (validSamples === 0) return null;
        
            // Return average color
            return {
                r: Math.round(rTotal / validSamples),
                g: Math.round(gTotal / validSamples),
                b: Math.round(bTotal / validSamples),
                validSamples
            };
        };

        let detectedColor = 'Gray';
        let detectedPosition = { x: 0, y: 0 };
        let bestMatch = { distance: Infinity, color: 'Gray', x: 0, y: 0 };
        
        // Scan from bottom to top
        for (let y = topCanvas.height - 1; y >= 0; y--) {
            for (let x = 0; x < topCanvas.width; x += 3) { // Skip pixels for performance
                const sampleResult = getSampleColor(x, y, topData, topCanvas.width);
                
                if (!sampleResult || sampleResult.validSamples < 15) continue; // Require minimum valid samples
                
                const { r, g, b } = sampleResult;
                
                let minDistance = Infinity;
                let closestColor = 'Gray';
                
                for (const [colorName, [tr, tg, tb]] of Object.entries(ticketColors)) {
                    const distance = getColorDistance(r, g, b, tr, tg, tb);
                    
                    if (distance < minDistance && distance < colorThreshold * 3) {
                        minDistance = distance;
                        closestColor = colorName;
                    }
                }
                
                if (closestColor !== 'Gray' && minDistance < bestMatch.distance) {
                    bestMatch = { distance: minDistance, color: closestColor, x, y };
                }
            }
            
            // If we found a good match, stop searching
            if (bestMatch.distance < colorThreshold * 2) {
                break;
            }
        }
        
        // Use the best match found
        if (bestMatch.color !== 'Gray') {
            detectedColor = bestMatch.color;
            detectedPosition = { x: bestMatch.x, y: bestMatch.y };
            
            // Draw markers at detection point
            topCtx.beginPath();
            topCtx.arc(bestMatch.x, bestMatch.y, 5, 0, 2 * Math.PI);
            topCtx.fillStyle = 'red';
            topCtx.fill();
            topCtx.strokeStyle = 'white';
            topCtx.lineWidth = 2;
            topCtx.stroke();
            
            // Draw crosshairs
            topCtx.beginPath();
            topCtx.moveTo(bestMatch.x - 10, bestMatch.y);
            topCtx.lineTo(bestMatch.x + 10, bestMatch.y);
            topCtx.moveTo(bestMatch.x, bestMatch.y - 10);
            topCtx.lineTo(bestMatch.x, bestMatch.y + 10);
            topCtx.strokeStyle = 'white';
            topCtx.lineWidth = 2;
            topCtx.stroke();
            
            console.log(`Detected ${detectedColor} at position x:${bestMatch.x}, y:${bestMatch.y}`);
        }
  
          console.log(`Detected color: ${detectedColor}`);
  
          // Extract a piece of the image (e.g., top-left corner)
          const pieceCanvas = document.createElement('canvas');
          const pieceCtx = pieceCanvas.getContext('2d');
          if (!pieceCtx) {
            throw new Error('Piece canvas context not available');
          }
  
          const pieceSize = 100; // Adjust the size of the image piece
          pieceCanvas.width = pieceSize;
          pieceCanvas.height = pieceSize;
          pieceCtx.drawImage(image, 0, 0, pieceSize, pieceSize);
          const imagePiece = pieceCanvas.toDataURL();
  
          // Process the remaining top part of the image
          const topTrimHeight = Math.floor(image.height * 0.05);
          const remainingHeight = halfHeight - topTrimHeight;
  
          // Set canvas dimensions for the remaining top part
          remainderTopCanvas.width = image.width;
          remainderTopCanvas.height = remainingHeight;
  
          // Draw the remaining top part of the image
          remainderTopCtx.drawImage(image, 0, topTrimHeight, image.width, remainingHeight, 0, 0, image.width, remainingHeight);
  
          // Cut the remaining top part in half horizontally and keep the right side
          const halfWidth = Math.floor(remainderTopCanvas.width / 2);
          const rightSideImageData = remainderTopCtx.getImageData(halfWidth, 0, halfWidth, remainderTopCanvas.height);
  
          // Cut the top 45% of the right side and keep the top part
          const top45Height = Math.floor(remainderTopCanvas.height * 0.45);
          const top45RightSideImageData = remainderTopCtx.getImageData(halfWidth, 0, halfWidth, top45Height);
  
          // Set canvas dimensions for the processed part
          remainderTopCanvas.width = halfWidth;
          remainderTopCanvas.height = top45Height;
  
          // Draw the processed part onto the canvas
          remainderTopCtx.putImageData(top45RightSideImageData, 0, 0);
  
          // Use jsQR to detect the QR code
          const qrCode = jsQR(top45RightSideImageData.data, halfWidth, top45Height);
          let qrCodeData = '';
          if (qrCode) {
            const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = qrCode.location;
            const qrCodeWidth = topRightCorner.x - topLeftCorner.x;
            const qrCodeHeight = bottomLeftCorner.y - topLeftCorner.y;
  
            // Set canvas dimensions for the QR code
            qrCodeCanvas.width = qrCodeWidth;
            qrCodeCanvas.height = qrCodeHeight;
  
            // Draw the QR code onto the canvas
            qrCodeCtx.drawImage(
              remainderTopCanvas,
              topLeftCorner.x, topLeftCorner.y, qrCodeWidth, qrCodeHeight,
              0, 0, qrCodeWidth, qrCodeHeight
            );

            // Get the QR code data as a base64 string
            qrCodeData = qrCodeCanvas.toDataURL();
          }
  
          // Process the bottom part of the image
          const bottomStartY = Math.floor(image.height * 0.75); // Start scanning from 75% of the image height
          const bottomEndY = Math.floor(image.height * 0.9); // End scanning at 90% of the image height
  
          // Set canvas dimensions for bottom part
          bottomCanvas.width = image.width;
          bottomCanvas.height = bottomEndY - bottomStartY;
  
          // Draw the bottom part of the image
          bottomCtx.drawImage(image, 0, bottomStartY, image.width, bottomEndY - bottomStartY, 0, 0, image.width, bottomEndY - bottomStartY);
  
          const bottomImageData = bottomCtx.getImageData(0, 0, bottomCanvas.width, bottomCanvas.height);
          const bottomData = bottomImageData.data;
  
          const extractedColors: string[] = [];
          const uniqueTicketColors: string[] = [];
          const colorPositions: { x: number, y: number }[] = [];
  
          // Process the bottom part of the image at 25%, 50%, and 75% of the width
          const positions = [Math.floor(bottomCanvas.width * 0.25), Math.floor(bottomCanvas.width * 0.5), Math.floor(bottomCanvas.width * 0.75)];
          positions.forEach(x => {
            let foundColor = false;
            for (let y = 5; y < bottomCanvas.height; y++) { // Start scanning 5 pixels down
              const index = (y * bottomCanvas.width + x) * 4;
              const r = bottomData[index];
              const g = bottomData[index + 1];
              const b = bottomData[index + 2];
              const a = bottomData[index + 3];
  
              if (a === 0) continue;
  
              // Ignore white, black, and gray colors
              if ((r > 243 && g > 243 && b > 243) || (r < 10 && g < 10 && b < 10) || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10)) continue;
  
              const color = `rgb(${r},${g},${b})`;
              if (!extractedColors.includes(color)) {
                extractedColors.push(color);
                colorPositions.push({ x, y });
                foundColor = true;
                break;
              }
            }
  
            // If a color was found, move 5 pixels down and grab the color
            if (foundColor) {
              const y = colorPositions[colorPositions.length - 1].y + 5;
              if (y < bottomCanvas.height) {
                const index = (y * bottomCanvas.width + x) * 4;
                const r = bottomData[index];
                const g = bottomData[index + 1];
                const b = bottomData[index + 2];
                const a = bottomData[index + 3];
  
                if (a !== 0 && !((r > 243 && g > 243 && b > 243) || (r < 10 && g < 10 && b < 10) || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10))) {
                  const color = `rgb(${r},${g},${b})`;
                  if (!uniqueTicketColors.includes(color)) {
                    uniqueTicketColors.push(color);
                    colorPositions.push({ x, y });
                  }
                }
              }
            }
  
            if (uniqueTicketColors.length >= 3) return; // Extract up to 3 colors
          });
  
          console.log(`Extracted colors: ${uniqueTicketColors}`);
  
          // Draw red dots at the detected color positions
          colorPositions.forEach(pos => {
            bottomCtx.beginPath();
            bottomCtx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
            bottomCtx.fillStyle = 'red';
            bottomCtx.fill();
          });
  
          onExtract([detectedColor, ...uniqueTicketColors], imagePiece, qrCodeData);
        };
  
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error extracting image data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (file) {
        extractColorsAndPiece(file);
      }
    }, [file]);
  
    return (
      <div>
        {loading ? <p>Loading...</p> : <p>Image processed successfully.</p>}
        {imageSrc && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <canvas ref={topCanvasRef} style={{ width: '100%', height: 'auto', marginBottom: '10px' }} />
            <canvas ref={remainderTopCanvasRef} style={{ display: 'none', width: '100%', height: 'auto', marginBottom: '10px' }} />
            <canvas ref={bottomCanvasRef} style={{ width: '100%', height: 'auto', marginBottom: '10px' }} />
            <canvas ref={qrCodeCanvasRef} style={{ width: '100px', height: '100px', border: '1px solid black' }} />
          </div>
        )}
      </div>
    );
  };
  
  export default ImageExtractor;