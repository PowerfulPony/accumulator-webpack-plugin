/* eslint-disable import/no-unresolved, no-undef */
import meta from 'accumulator-webpack-plugin/meta';

import moduleA from './moduleA.txt';
import { moduleB, moduleC } from './dep';

const artifactUrl = meta.artifact;

const list = [moduleA, moduleB, moduleC];

const $body = document.body;
const $list = document.createElement('xmp');

$body.appendChild($list);

$list.textContent = `loading... ${artifactUrl}`;
fetch(artifactUrl)
  .then((response) => response.text())
  .then((content) => {
    const result = list.map((item) => ({
      path: item.path,
      content: content.substring(item.pos, item.pos + item.len),
    }));
    $list.textContent = `${JSON.stringify(result, null, 2)}`;
  });
