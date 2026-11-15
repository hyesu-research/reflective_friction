import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readBlobJson} from '../lib/blob-json.js';
test('weak HTTP ETags use matching storage metadata for conditional writes',async()=>{const blob={get:async()=>({statusCode:200,stream:new Blob(['{"ok":true}']).stream(),blob:{etag:'W/"version-one"'}}),head:async()=>({etag:'"version-one"'})};assert.deepEqual(await readBlobJson(blob,'case.json'),{data:{ok:true},etag:'"version-one"'})});
test('content and metadata from different versions are never paired',async()=>{let reads=0;const blob={get:async()=>({statusCode:200,stream:new Blob([JSON.stringify({version:++reads})]).stream(),blob:{etag:`W/"${reads}"`}}),head:async()=>({etag:'"2"'})};const r=await readBlobJson(blob,'case.json');assert.deepEqual(r,{data:{version:2},etag:'"2"'})});
