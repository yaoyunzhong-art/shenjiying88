# Pattern: Multi-Modal Embedding 接口统一

**适用场景**: 系统需要处理多种模态输入 (文本/图片/音频/视频)

## 模式

```typescript
// 统一接口, 但每种模态独立实现
export function embedTextV2(text: string, dim = 384): number[] { ... }
export function embedImageV2(image: ImageInput, dim = 512): number[] { ... }
export function embedAudioV2(audio: AudioInput, dim = 256): number[] { ... }

@Injectable()
export class MultimodalEmbeddingService {
  embed(input: ModalityInput): number[] {
    switch (input.type) {
      case 'text': return embedTextV2(input.text);
      case 'image': return embedImageV2(input.image);
      ...
    }
  }

  crossSimilarity(a: ModalityInput, b: ModalityInput): number {
    const vecA = this.embed(a);
    const vecB = this.embed(b);
    return cosineSimilarity(vecA.slice(0, min(vecA.length, vecB.length)), vecB.slice(0, ...));
  }
}
```

## 关键原则

1. **不同模态用不同维度**: 文本 384, 图片 512 (匹配真实模型)
2. **零向量边界**: cosine 除零时显式返回 0
3. **mock 必须严格按真实算法字节数**: sha256=32, md5=16
4. **跨模态切片对齐**: min(dim1, dim2) 而不是 pad/resize

## 真实生产实现

- 文本: `sentence-transformers/all-MiniLM-L6-v2` (384维)
- 图片: `openai/clip-vit-base-patch32` (512维)
- 跨模态: CLIP 原生支持,无需切片

## Phase-23 来源

T81 multimodal-embedding.service.ts (24/24 单测)
