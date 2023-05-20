import { Component, ElementRef, ViewChild } from '@angular/core';

import * as cocoSSD from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild('video') video?: ElementRef;
  @ViewChild('canvas') canvas?: ElementRef;

  public webCam?: MediaStream;
  public predict: boolean = false;

  private webCamWidth: number = 1;
  private webCamHeight: number = 1;

  ngOnInit() {
  }

  public async start(): Promise<void> {
    const constraints = {
      audio: false,
      video: {
        width: { min: 1024, ideal: 1920, max: 1920 },
        height: { min: 576, ideal: 1080, max: 1080 },
        facingMode: 'environment'
      },
    };

    try {
      this.webCam = await navigator.mediaDevices.getUserMedia(constraints);

      const settings = this.webCam?.getVideoTracks()[0]?.getSettings();
      this.webCamWidth = settings.width || 1;
      this.webCamHeight = settings.height || 1;
    } catch (e) {
      alert(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      this.webCam?.getTracks().forEach(e => e.stop());
      this.webCam = undefined;
      this.stopPrediction();

    } catch (e) {
      console.error('Error accessing the webcam', e);
    }
  }

  public async predictWithCocoModel() {
    if (this.predict) return;

    try {

      this.predict = true;
      const model = await cocoSSD.load({ base: 'lite_mobilenet_v2' });
      this.detectFrame(this.video?.nativeElement, model);
    } catch (e) {
      alert(e);
    }
  }

  public stopPrediction(): void {
    this.predict = false
    const ctx = this.canvas?.nativeElement.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private detectFrame(video: HTMLVideoElement, model: cocoSSD.ObjectDetection) {
    if (!this.predict) return;

    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  }

  private renderPredictions(predictions: cocoSSD.DetectedObject[]) {
    const ctx = this.canvas?.nativeElement.getContext("2d");
    const ratioWidth = ctx.canvas.width / this.webCamWidth;
    const ratioHeight = ctx.canvas.height / this.webCamHeight;

    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    predictions.forEach(prediction => {
      const x = ratioWidth * prediction.bbox[0];
      const y = ratioHeight * prediction.bbox[1];
      const width = ratioWidth * prediction.bbox[2];
      const height = ratioHeight * prediction.bbox[3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    predictions.forEach(prediction => {
      const x = ratioWidth * prediction.bbox[0];
      const y = ratioHeight * prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  };

}
