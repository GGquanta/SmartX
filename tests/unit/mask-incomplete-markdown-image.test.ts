import { describe, expect, it } from 'vitest';
import {
  findTrailingIncompleteMarkdownImageStart,
  maskIncompleteMarkdownImage,
} from '@/pages/Chat/mask-incomplete-markdown-image';

describe('maskIncompleteMarkdownImage', () => {
  it('does nothing when not streaming', () => {
    const text = '参考\n\n![架构图](https://kb.example.com/a.pn';
    expect(maskIncompleteMarkdownImage(text, false)).toEqual({
      text,
      showSkeleton: false,
    });
  });

  it('masks incomplete alt while streaming', () => {
    const text = '参考文档如下：\n\n![架构';
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text: '参考文档如下：',
      showSkeleton: true,
    });
  });

  it('masks incomplete destination url while streaming', () => {
    const text = '参考文档如下：\n\n![架构图](https://kb.example.com/assets/architecture.pn';
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text: '参考文档如下：',
      showSkeleton: true,
    });
  });

  it('masks right after ![ opens', () => {
    expect(maskIncompleteMarkdownImage('见图：![', true)).toEqual({
      text: '见图：',
      showSkeleton: true,
    });
  });

  it('keeps complete https markdown images', () => {
    const text = '参考文档如下：\n\n![架构图](https://kb.example.com/assets/architecture.png)';
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text,
      showSkeleton: false,
    });
  });

  it('masks only the trailing incomplete image after a complete one', () => {
    const text = [
      '第一张：![a](https://kb.example.com/a.png)',
      '第二张：![b](https://kb.example.com/b.pn',
    ].join('\n');

    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text: '第一张：![a](https://kb.example.com/a.png)\n第二张：',
      showSkeleton: true,
    });
  });

  it('does not mask abandoned ![alt] prose that is not an image destination', () => {
    const text = 'Markdown 写法是 ![alt] 然后跟链接';
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text,
      showSkeleton: false,
    });
  });

  it('does not mask incomplete image syntax inside fenced code', () => {
    const text = ['示例：', '```', '![架构图](https://kb.example.com/a.pn', '```'].join('\n');
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text,
      showSkeleton: false,
    });
  });

  it('does not mask incomplete image syntax inside an unclosed fence', () => {
    const text = '示例：\n```md\n![架构图](https://kb.example.com/a.pn';
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text,
      showSkeleton: false,
    });
  });

  it('still masks incomplete images after a closed fence', () => {
    const text = ['```', 'code', '```', '', '见图：![架构图](https://kb.example.com/a.pn'].join('\n');
    expect(maskIncompleteMarkdownImage(text, true)).toEqual({
      text: ['```', 'code', '```', '', '见图：'].join('\n'),
      showSkeleton: true,
    });
  });
});

describe('findTrailingIncompleteMarkdownImageStart', () => {
  it('returns -1 for complete images', () => {
    expect(
      findTrailingIncompleteMarkdownImageStart('![a](https://example.com/a.png)'),
    ).toBe(-1);
  });

  it('points at the bang of an incomplete destination', () => {
    const text = 'prefix ![alt](https://example.com/a.pn';
    expect(findTrailingIncompleteMarkdownImageStart(text)).toBe('prefix '.length);
  });
});
