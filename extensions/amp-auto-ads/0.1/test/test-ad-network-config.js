/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Services} from '../../../../src/services';
import {getAdNetworkConfig} from '../ad-network-config';

describes.realWin(
  'ad-network-config',
  {
    amp: {
      canonicalUrl: 'https://foo.bar/baz',
      runtimeOn: true,
      ampdoc: 'single',
    },
  },
  env => {
    let ampAutoAdsElem;
    let document;

    beforeEach(() => {
      document = env.win.document;
      ampAutoAdsElem = document.createElement('amp-auto-ads');
      env.win.document.body.appendChild(ampAutoAdsElem);
    });

    afterEach(() => {
      env.win.document.body.removeChild(ampAutoAdsElem);
    });

    describe('AdSense', () => {
      const AD_CLIENT = 'ca-pub-1234';
      const AD_HOST = 'ca-pub-5678';

      beforeEach(() => {
        ampAutoAdsElem.setAttribute('data-ad-client', AD_CLIENT);
      });

      it('should generate the config fetch URL', () => {
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getConfigUrl()).to.equal(
          '//pagead2.googlesyndication.com/getconfig/ama?client=' +
            AD_CLIENT +
            '&plah=foo.bar&ama_t=amp&' +
            'url=https%3A%2F%2Ffoo.bar%2Fbaz'
        );
      });

      it('should report responsive-enabled', () => {
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.isResponsiveEnabled()).to.equal(true);
      });

      // TODO(bradfrizzell, #12476): Make this test work with sinon 4.0.
      it.skip("should truncate the URL if it's too long", () => {
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);

        const canonicalUrl =
          'http://foo.bar/a'.repeat(4050) + 'shouldnt_be_included';

        const docInfo = Services.documentInfoForDoc(ampAutoAdsElem);
        sandbox.stub(docInfo, 'canonicalUrl').callsFake(canonicalUrl);

        const url = adNetwork.getConfigUrl();
        expect(url).to.contain('ama_t=amp');
        expect(url).to.contain('url=http%3A%2F%2Ffoo.bar');
        expect(url).not.to.contain('shouldnt_be_included');
      });

      it('should generate the attributes', () => {
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getAttributes()).to.deep.equal({
          'type': 'adsense',
          'data-ad-client': 'ca-pub-1234',
        });
      });

      it('should add data-ad-host to attributes if set on ampAutoAdsElem', () => {
        ampAutoAdsElem.setAttribute('data-ad-host', AD_HOST);
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getAttributes()).to.deep.equal({
          'type': 'adsense',
          'data-ad-client': AD_CLIENT,
          'data-ad-host': AD_HOST,
        });
        ampAutoAdsElem.removeAttribute('data-ad-host');
      });

      it('should get the default ad constraints', () => {
        const viewportMock = sandbox.mock(
          Services.viewportForDoc(env.win.document)
        );
        viewportMock
          .expects('getSize')
          .returns({width: 320, height: 500})
          .atLeast(1);

        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getDefaultAdConstraints()).to.deep.equal({
          initialMinSpacing: 500,
          subsequentMinSpacing: [
            {adCount: 3, spacing: 1000},
            {adCount: 6, spacing: 1500},
          ],
          maxAdCount: 8,
        });
      });

      it('should get sticky attributes if opted in for anchor ads', () => {
        const configObj = {
          optInStatus: [2],
        };
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getStickyAdAttributes(configObj)).to.deep.equal({
          'no-fill': 'false',
        });
      });

      it('should get sticky attributes if opted in for no fill anchor ads', () => {
        const configObj = {
          optInStatus: [4],
        };
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getStickyAdAttributes(configObj)).to.deep.equal({
          'no-fill': 'true',
        });
      });

      it('should get sticky attributes if opted in for both anchor ads and no fill ads', () => {
        const configObj = {
          optInStatus: [2, 4],
        };
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getStickyAdAttributes(configObj)).to.deep.equal({
          'no-fill': 'false',
        });
      });

      it('should return null if not opted in for anchor ads and no fill ads', () => {
        const adNetwork = getAdNetworkConfig('adsense', ampAutoAdsElem);
        expect(adNetwork.getStickyAdAttributes()).to.be.null;
      });
    });

    describe('Doubleclick', () => {
      const AD_LEGACY_CLIENT = 'ca-pub-1234';

      const TARGETING_JSON = {'Categories': 'A'};

      const EXPERIMENT_SETTINGS = {'width': 300, 'height': 250};

      const AD_SLOT = '1234/example.com/SLOT_1';

      beforeEach(() => {
        ampAutoAdsElem.setAttribute('data-ad-legacy-client', AD_LEGACY_CLIENT);
        ampAutoAdsElem.setAttribute(
          'data-experiment',
          JSON.stringify(EXPERIMENT_SETTINGS)
        );
        ampAutoAdsElem.setAttribute(
          'data-json',
          JSON.stringify(TARGETING_JSON)
        );
        ampAutoAdsElem.setAttribute('data-slot', AD_SLOT);
      });

      it('should report enabled always', () => {
        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
        expect(adNetwork.isEnabled(env.win)).to.equal(true);
      });

      it('should generate the config fetch URL', () => {
        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
        expect(adNetwork.getConfigUrl()).to.equal(
          '//pagead2.googlesyndication.com/getconfig/ama?client=' +
            AD_LEGACY_CLIENT +
            '&plah=foo.bar&ama_t=amp&' +
            'url=https%3A%2F%2Ffoo.bar%2Fbaz'
        );
      });

      // TODO(bradfrizzell, #12476): Make this test work with sinon 4.0.
      it.skip("should truncate the URL if it's too long", () => {
        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);

        const canonicalUrl =
          'http://foo.bar/a'.repeat(4050) + 'shouldnt_be_included';

        const docInfo = Services.documentInfoForDoc(ampAutoAdsElem);
        sandbox.stub(docInfo, 'canonicalUrl').callsFake(canonicalUrl);

        const url = adNetwork.getConfigUrl();
        expect(url).to.contain('ama_t=amp');
        expect(url).to.contain('url=http%3A%2F%2Ffoo.bar');
        expect(url).not.to.contain('shouldnt_be_included');
      });

      it('should generate the attributes', () => {
        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
        expect(adNetwork.getAttributes()).to.deep.equal({
          'type': 'doubleclick',
          'json': JSON.stringify(TARGETING_JSON),
          'data-slot': AD_SLOT,
        });
      });

      it('should get the default ad constraints', () => {
        const viewportMock = sandbox.mock(
          Services.viewportForDoc(env.win.document)
        );
        viewportMock
          .expects('getSize')
          .returns({width: 320, height: 500})
          .atLeast(1);

        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
        expect(adNetwork.getDefaultAdConstraints()).to.deep.equal({
          initialMinSpacing: 500,
          subsequentMinSpacing: [
            {adCount: 3, spacing: 1000},
            {adCount: 6, spacing: 1500},
          ],
          maxAdCount: 8,
        });
      });

      it('should not be responsive-enabled', () => {
        const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
        expect(adNetwork.isResponsiveEnabled()).to.be.false;
      });
    });

    it('should return null for sticky attributes', () => {
      const adNetwork = getAdNetworkConfig('doubleclick', ampAutoAdsElem);
      expect(adNetwork.getStickyAdAttributes()).to.be.null;
    });

    it('should return null for unknown type', () => {
      expect(getAdNetworkConfig('unknowntype', ampAutoAdsElem)).to.be.null;
    });
  }
);
