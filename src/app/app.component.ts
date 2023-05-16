import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

import * as cocoSSD from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-cpu';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild('video') video?: ElementRef;
  public webCam?: MediaStream;

  ngOnInit() {
  }

  public async start(): Promise<void> {
    const constraints = {
      audio: false, video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 },
      },
    };


    try {
      this.webCam = await navigator.mediaDevices.getUserMedia(constraints).then();
    } catch (e) {
      console.error('Error accessing the webcam', e);
    }
  }

  public async stop(): Promise<void> {
    try {
      this.webCam?.getTracks().forEach(e => e.stop());
      this.webCam = undefined;

    } catch (e) {
      console.error('Error accessing the webcam', e);
    }

  }

  // private async predictWithCocoModel() {
  //   const model = await cocoSSD.load({ base: 'lite_mobilenet_v2' });

  //   if (!this.video) {
  //     console.log("NO VIDEO");
  //     return;
  //   }

  //   this.detectFrame(this.video, model);
  //   console.log('model loaded');
  // }

  private detectFrame(video: HTMLVideoElement, model: cocoSSD.ObjectDetection) {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  }

  private renderPredictions(predictions: cocoSSD.DetectedObject[]) {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 300;
    canvas.height = 300;

    if (ctx == null) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    if (!this.video) {
      console.log("NO VIDEO");
      return;
    }

    // ctx.drawImage(this.video, 0, 0, 300, 300);

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
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
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  };

}
