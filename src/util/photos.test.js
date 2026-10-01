import { cldUrl, fitWithin } from './photos';
import { tileShape } from 'components/invitation/PhotoAlbum';

const PHOTO = 'https://res.cloudinary.com/follme/image/upload/v17/FollMe/events/e1/a.jpg';

describe('cldUrl', () => {
  it('adds the transformation, quality and format to Cloudinary photos', () => {
    expect(cldUrl(PHOTO, 'w_800,c_limit'))
      .toBe('https://res.cloudinary.com/follme/image/upload/w_800,c_limit,q_auto,f_auto/v17/FollMe/events/e1/a.jpg');
  });

  it('leaves other photos alone', () => {
    expect(cldUrl('/imgs/demo/1.jpg', 'w_800')).toBe('/imgs/demo/1.jpg');
    expect(cldUrl('https://example.com/image/upload/a.jpg', 'w_800')).toBe('https://example.com/image/upload/a.jpg');
    expect(cldUrl(PHOTO)).toBe(PHOTO);
    expect(cldUrl(undefined, 'w_1')).toBeUndefined();
  });
});

describe('tileShape', () => {
  const shapes = n => Array.from({ length: n }, (_, i) => tileShape(i, n));

  it('leads with a big photo and never leaves a gap at the end', () => {
    expect(shapes(2)).toEqual(['feature', 'wide']);
    expect(shapes(3)).toEqual(['feature', 'tall', 'tall']);
    expect(shapes(4)).toEqual(['feature', 'tall', 'tall', 'wide']);
    expect(shapes(5)).toEqual(['feature', 'tall', 'tall', 'tall', 'tall']);
  });
});

describe('fitWithin', () => {
  it('scales the longer side down, never up', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 });
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
});
