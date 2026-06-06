export const VALID_MODES = ['srv', 'cnc'] as const;
export type Mode = (typeof VALID_MODES)[number];

export const VALID_PROVIDERS = ['jitsi', 'wbstream', 'telemost'] as const;
export type Provider = (typeof VALID_PROVIDERS)[number];

export const VALID_TRANSPORTS = [
	'datachannel',
	'vp8channel',
	'seichannel',
	'videochannel'
] as const;
export type Transport = (typeof VALID_TRANSPORTS)[number];

export const PROVIDER_CONFIG = {
	jitsi: {
		label: 'Инстанс Jitsi Meet',
		defaultRoomUrl: 'https://meet1.arbitr.ru/myroom',
		transport: 'datachannel',
		allowedTransports: ['datachannel', 'vp8channel'],
		dns: '8.8.8.8:53',
		socksPort: 8808
	},
	wbstream: {
		label: 'WB Stream',
		defaultRoomUrl: 'https://stream.wb.ru/room/demo-tunnel',
		transport: 'vp8channel',
		allowedTransports: ['vp8channel', 'seichannel'],
		dns: '8.8.8.8:53',
		socksPort: 8809
	},
	telemost: {
		label: 'Яндекс.Телемост',
		defaultRoomUrl: 'https://telemost.yandex.ru/j/12345678901234',
		transport: 'videochannel',
		allowedTransports: ['videochannel', 'vp8channel'],
		dns: '8.8.8.8:53',
		socksPort: 8810
	}
} as const;

export type ProviderType = Provider;

export function isValidMode(value: string | undefined): value is Mode {
	return VALID_MODES.includes(value as Mode);
}

export function isValidProvider(value: string | undefined): value is Provider {
	return VALID_PROVIDERS.includes(value as Provider);
}

export function isValidTransport(value: string | undefined): value is Transport {
	return VALID_TRANSPORTS.includes(value as Transport);
}

export const JITSI_SERVERS = [
	'meet1.arbitr.ru',
	'meet.astondevs.ru',
	'meet.saby.ru',
	'meet.dgo.mos.ru',
	'meet.fastguard.io',
	'meet.egovm.ru',
	'jitsi.etudevs.ru',
	'conf.edu-kuban.ru',
	'testperegovorka.mos.ru',
	'jitsi.lisgames.ru',
	'jitsi.adc.spb.ru',
	'conf.aplosoft.ru',
	'conf.hyperia.space',
	'conf.movistagroup.ru',
	'conference.ct.placetime.team',
	'conference.umschool.dev',
	'jitsi-meet.magnit.ru',
	'jitsi.mymeet.co',
	'meet-dev.efko.ru',
	'meet.ars.ru',
	'meet.astrocard-iservice.com',
	'meet.bl3ndr.io',
	'meet.cityair.ru',
	'meet.cryptopro.ru',
	'meet.dwh.runit.cc',
	'meet.ecopsy.com',
	'meet.emdev.ru',
	'meet.igtel.ru',
	'meet.lis314.ru',
	'meet.mamba.group',
	'meet.minuszero.ru',
	'meet.mirox.chat',
	'meet.playform.ru',
	'meet.realweb.ru',
	'meet.riddlerx.org',
	'meet.santehnika.online',
	'meet.servicepipe.ru',
	'meet.small-dm.ru',
	'meet.softwell.ru',
	'meetings.iitrust.ru',
	'ru.meet.pnh.capital',
	'talk.stackservice.ru',
	'trueconf.com',
	'videoconfcall.vtcmobile.ru',
	'videoconference.moyadoska.com',
	'webinar.devknomarylms.ru',
	'webinar.knomary.dev',
	'zgn-y-vc01.zignotch.com',
	'partner-dm.ru',
	'jit.wik-prod.ru',
	'meet.geotec.ru',
	'jitsi.100let-jitsi.ru',
	'meet.kodit.dev',
	'vb-lb-4.onlinemektep.org',
	'voice.prodamus.online',
	'ea5aipiewu.skykot.xyz',
	'meetings.shamsa.net',
	'meet.greenfinance.ru',
	'jitsi.bwg-io.site',
	'video-b.priem.com',
	'meet.redmadrobot.com',
	'event33.ru',
	'areatech.space',
	'video-dev.priem.one',
	'meet.cbt-mm.ru',
	'meet.code2050.ru',
	'meet.interneturok.ru',
	'bridge.mt-fluffythefluff.ru',
	'meeting.dks.lanit.ru',
	'jm.fincpanetwork.ru',
	'meet.uchi.pro',
	'dion.vc',
	'kontur.ru/talk',
	'exoculo-sonzai.com',
	'sofakequa.beget.app',
	'meet.tilda.team',
	'jitsi.iconsoft.ru',
	'jitsi.tech',
	'm.catonmoon.com',
	'jitsi-meet.oskelly.tech',
	'calls.dgr.am',
	'meet.lentabd.ru'
];
