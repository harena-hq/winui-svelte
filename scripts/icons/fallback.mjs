/**
 * The glyphs the fallback face draws, and what each draws off Windows. ADR 0018 and its two
 * 2026-10-16 amendments.
 *
 * Two sets of rows, one table. `DRAWN` is every Segoe Fluent Icons code point that a component
 * in the package, exported from the root or from `preview`, writes for itself: a chevron, a
 * close button, a check, a media command, `Symbol` names it or not. Conformance C19 reads the
 * components for those points and fails on one that is not a `DRAWN` row, and on a `DRAWN` row
 * none of them draws. `SYMBOLS` is every other code point the release's `Symbol` names, the
 * glyph WinUI draws for each member of its `Symbol` enum, so a consumer who writes
 * `glyph={Symbol.Save}` gets a save icon off Windows too; `font.mjs` fails if a member's point
 * is in neither. A code point a consumer passes as `glyph` that `Symbol` does not name draws
 * whatever the browser substitutes, if
 * anything.
 *
 * `segoe` is the Segoe glyph's name, and in `SYMBOLS` the `Symbol` members that draw it. Three
 * `DRAWN` points, E0B8, E627 and E628, are in neither of Microsoft's published lists for Segoe
 * Fluent Icons and Segoe MDL2 Assets, and are named for what draws them.
 * `fluent` names the Fluent UI System Icons SVG whose shape stands in for it, chosen by eye
 * against the Segoe glyph, so a stand-in is the same idea in Fluent's drawing and not always
 * the same picture. `box` is the Segoe Fluent Icons glyph's ink,
 * `[left, right, bottom, top]` in thousandths of an em: left and right from the glyph's
 * origin, bottom and top above the baseline. It was measured on the reference guest with a
 * canvas's `measureText` at 1000px, where the font's ascent is 1000 and its descent 0, which
 * `font.mjs` gives this one too. The stand-in is scaled, without distortion, to fit that box
 * and centred in it. `absent` marks a point the reference guest's Segoe Fluent Icons does not
 * have, which the face draws on Windows too.
 *
 * `part: 'holes'` takes the subpaths after a filled circle's first, the symbol the circle has
 * knocked out of it, and places them with the transform the row named by `with` was fitted
 * with. InfoBar draws its severity icon as two glyphs, the circle `StatusCircleOuter` and a
 * symbol over it in another colour, and Fluent draws the same pair as one circle with the
 * symbol cut out; sharing the circle's transform keeps the symbol where Fluent put it. Such a
 * row's `box` is the Segoe symbol's, measured the same way; nothing is fitted to it, and
 * `tests/visual/icon-fallback.spec.ts` holds the symbol drawn here near its centre.
 */
const DRAWN = [
	{ point: 'E0B8', segoe: 'ZoomOut', fluent: 'subtract_16_filled', box: [0, 1000, 328, 672] },
	{ point: 'E627', segoe: 'Rewind', fluent: 'rewind_16_filled', box: [16, 1000, 125, 875] },
	{
		point: 'E628',
		segoe: 'FastForward',
		fluent: 'fast_forward_16_filled',
		box: [0, 984, 125, 875]
	},
	{
		point: 'E700',
		segoe: 'GlobalNavButton',
		fluent: 'navigation_16_regular',
		box: [0, 1000, 188, 875]
	},
	{
		point: 'E70D',
		segoe: 'ChevronDown',
		fluent: 'chevron_down_16_regular',
		box: [125, 875, 281, 688]
	},
	{ point: 'E70E', segoe: 'ChevronUp', fluent: 'chevron_up_16_regular', box: [125, 875, 313, 719] },
	{ point: 'E710', segoe: 'Add', fluent: 'add_16_regular', box: [63, 875, 125, 938] },
	{ point: 'E711', segoe: 'Cancel', fluent: 'dismiss_16_regular', box: [125, 813, 188, 875] },
	{ point: 'E712', segoe: 'More', fluent: 'more_horizontal_16_regular', box: [109, 891, 422, 578] },
	{ point: 'E713', segoe: 'Settings', fluent: 'settings_16_regular', box: [16, 984, 0, 1000] },
	{ point: 'E716', segoe: 'People', fluent: 'people_16_regular', box: [0, 1000, 63, 1000] },
	{ point: 'E72B', segoe: 'Back', fluent: 'arrow_left_16_regular', box: [0, 1000, 63, 1000] },
	{
		point: 'E72C',
		segoe: 'Refresh',
		fluent: 'arrow_clockwise_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E734',
		segoe: 'FavoriteStar',
		fluent: 'star_16_regular',
		box: [0, 1000, 16, 984]
	},
	{ point: 'E735', segoe: 'FavoriteStarFill', fluent: 'star_16_filled', box: [0, 1000, 16, 984] },
	{ point: 'E73E', segoe: 'CheckMark', fluent: 'checkmark_16_regular', box: [125, 875, 219, 750] },
	{
		point: 'E76C',
		segoe: 'ChevronRight',
		fluent: 'chevron_right_16_regular',
		box: [313, 719, 125, 875]
	},
	{ point: 'E77B', segoe: 'Contact', fluent: 'person_16_regular', box: [63, 938, 0, 1000] },
	{ point: 'E787', segoe: 'Calendar', fluent: 'calendar_ltr_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E799', segoe: 'AspectRatio', fluent: 'resize_16_regular', box: [0, 1000, 125, 875] },
	{ point: 'E894', segoe: 'Clear', fluent: 'dismiss_16_regular', box: [125, 813, 188, 875] },
	{ point: 'E8FB', segoe: 'Accept', fluent: 'checkmark_16_regular', box: [0, 1000, 188, 875] },
	{ point: 'E915', segoe: 'RadioBullet', fluent: 'circle_16_filled', box: [313, 688, 313, 688] },
	{
		point: 'E96E',
		segoe: 'ChevronDownSmall',
		fluent: 'chevron_down_16_regular',
		box: [125, 875, 313, 750]
	},
	{
		point: 'E974',
		segoe: 'ChevronRightMed',
		fluent: 'chevron_right_16_regular',
		box: [328, 719, 156, 844]
	},
	{ point: 'E9AE', segoe: 'DashKey', fluent: 'subtract_16_regular', box: [250, 688, 438, 500] },
	{ point: 'EA3B', segoe: 'CircleFill', fluent: 'circle_16_filled', box: [31, 969, 31, 969] },
	{
		point: 'EC15',
		segoe: 'MiracastLogoSmall',
		fluent: 'cast_20_regular',
		box: [0, 1000, 125, 938]
	},
	{
		point: 'EC57',
		segoe: 'PlaybackRate1x',
		fluent: 'play_circle_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'ED1E',
		segoe: 'Subtitles',
		fluent: 'closed_caption_16_regular',
		box: [0, 1000, 125, 875]
	},
	{
		point: 'ED1F',
		segoe: 'SubtitlesAudio',
		fluent: 'speaker_2_16_regular',
		box: [0, 1000, 0, 875]
	},
	{
		point: 'ED3C',
		segoe: 'SkipBack10',
		fluent: 'skip_back_10_20_regular',
		box: [63, 953, 63, 938]
	},
	{
		point: 'ED3D',
		segoe: 'SkipForward30',
		fluent: 'skip_forward_30_20_regular',
		box: [47, 938, 63, 938]
	},
	{
		point: 'EDD9',
		segoe: 'CaretLeftSolid8',
		fluent: 'caret_left_16_filled',
		box: [125, 875, 0, 1000]
	},
	{
		point: 'EDDA',
		segoe: 'CaretRightSolid8',
		fluent: 'caret_right_16_filled',
		box: [125, 875, 0, 1000]
	},
	{ point: 'EDDB', segoe: 'CaretUpSolid8', fluent: 'caret_up_16_filled', box: [0, 1000, 125, 875] },
	{
		point: 'EDDC',
		segoe: 'CaretDownSolid8',
		fluent: 'caret_down_16_filled',
		box: [0, 1000, 125, 875]
	},
	{ point: 'F136', segoe: 'StatusCircleOuter', fluent: 'circle_16_filled', box: [0, 938, 0, 938] },
	{
		point: 'F13C',
		segoe: 'StatusCircleExclamation',
		fluent: 'error_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [422, 516, 250, 656]
	},
	{
		point: 'F13D',
		segoe: 'StatusCircleErrorX',
		fluent: 'dismiss_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [313, 625, 313, 625]
	},
	{
		point: 'F13E',
		segoe: 'StatusCircleCheckmark',
		fluent: 'checkmark_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [250, 688, 313, 625]
	},
	{
		point: 'F13F',
		segoe: 'StatusCircleInfo',
		fluent: 'info_16_filled',
		part: 'holes',
		with: 'F136',
		box: [422, 516, 281, 688]
	},
	{ point: 'F5B0', segoe: 'PlaySolid', fluent: 'play_16_filled', box: [125, 938, 47, 953] },
	{
		point: 'F78D',
		segoe: 'RevealPasswordMedium',
		fluent: 'eye_16_regular',
		box: [0, 1000, 156, 844]
	},
	{ point: 'F8AC', segoe: 'BackSolidBold', fluent: 'previous_16_filled', box: [63, 938, 63, 938] },
	{ point: 'F8AD', segoe: 'ForwardSolidBold', fluent: 'next_16_filled', box: [63, 938, 63, 938] },
	{ point: 'F8AE', segoe: 'PauseBold', fluent: 'pause_16_filled', box: [63, 938, 63, 938] }
];

// Sorted by code point. A point `DRAWN` has is not repeated here.
const SYMBOLS = [
	{ point: 'E18A', segoe: 'Placeholder', fluent: 'diamond_16_regular', box: [0, 1000, 0, 1000] },
	{
		point: 'E620',
		segoe: 'StopSlideShow',
		fluent: 'record_stop_16_regular',
		box: [0, 1000, 63, 938]
	},
	{ point: 'E707', segoe: 'Map', fluent: 'map_16_regular', box: [16, 922, 0, 1000] },
	{ point: 'E70F', segoe: 'Edit', fluent: 'edit_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E714', segoe: 'Video', fluent: 'video_16_regular', box: [0, 1000, 125, 875] },
	{ point: 'E715', segoe: 'Mail', fluent: 'mail_16_regular', box: [0, 1000, 63, 875] },
	{ point: 'E717', segoe: 'Phone', fluent: 'call_16_regular', box: [125, 875, 0, 1000] },
	{ point: 'E718', segoe: 'Pin', fluent: 'pin_16_regular', box: [0, 984, 0, 984] },
	{ point: 'E719', segoe: 'Shop', fluent: 'shopping_bag_16_regular', box: [125, 875, 0, 1000] },
	{ point: 'E71A', segoe: 'Stop', fluent: 'stop_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E71B', segoe: 'Link', fluent: 'link_16_regular', box: [0, 1000, 250, 813] },
	{ point: 'E71C', segoe: 'Filter', fluent: 'filter_16_regular', box: [0, 1000, 0, 938] },
	{ point: 'E71D', segoe: 'AllApps', fluent: 'apps_list_20_regular', box: [63, 938, 63, 938] },
	{ point: 'E71E', segoe: 'Zoom', fluent: 'search_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E71F', segoe: 'ZoomOut', fluent: 'zoom_out_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E720', segoe: 'Microphone', fluent: 'mic_16_regular', box: [156, 844, 0, 1000] },
	{ point: 'E721', segoe: 'Find', fluent: 'search_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E722', segoe: 'Camera', fluent: 'camera_16_regular', box: [0, 1000, 63, 1000] },
	{ point: 'E723', segoe: 'Attach', fluent: 'attach_16_regular', box: [63, 875, 63, 938] },
	{ point: 'E724', segoe: 'Send', fluent: 'send_16_regular', box: [0, 1000, 63, 1000] },
	{ point: 'E729', segoe: 'Page', fluent: 'document_16_filled', box: [125, 875, 0, 1000] },
	{ point: 'E72A', segoe: 'Forward', fluent: 'arrow_right_16_regular', box: [0, 1000, 63, 1000] },
	{ point: 'E72D', segoe: 'Share', fluent: 'share_16_regular', box: [63, 984, 63, 938] },
	{
		point: 'E730',
		segoe: 'ReportHacked',
		fluent: 'shield_error_16_regular',
		box: [63, 938, 0, 1000]
	},
	{ point: 'E738', segoe: 'Remove', fluent: 'subtract_16_regular', box: [63, 875, 500, 563] },
	{
		point: 'E73F',
		segoe: 'BackToWindow',
		fluent: 'arrow_minimize_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E740',
		segoe: 'FullScreen',
		fluent: 'arrow_maximize_16_regular',
		box: [63, 938, 63, 938]
	},
	{ point: 'E749', segoe: 'Print', fluent: 'print_16_regular', box: [0, 1000, 63, 938] },
	{ point: 'E74A', segoe: 'Up', fluent: 'arrow_up_16_regular', box: [0, 938, 0, 1000] },
	{ point: 'E74D', segoe: 'Delete', fluent: 'delete_16_regular', box: [31, 969, 0, 1000] },
	{ point: 'E74E', segoe: 'Save', fluent: 'save_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E74F', segoe: 'Mute', fluent: 'speaker_mute_16_regular', box: [0, 938, 141, 859] },
	{ point: 'E765', segoe: 'Keyboard', fluent: 'keyboard_16_regular', box: [0, 1000, 188, 875] },
	{ point: 'E767', segoe: 'Volume', fluent: 'speaker_2_16_regular', box: [0, 1000, 78, 922] },
	{ point: 'E768', segoe: 'Play', fluent: 'play_16_regular', box: [125, 938, 47, 953] },
	{ point: 'E769', segoe: 'Pause', fluent: 'pause_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E76E', segoe: 'Emoji2', fluent: 'emoji_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E774', segoe: 'Globe', fluent: 'globe_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E778', segoe: 'HangUp', fluent: 'call_end_16_regular', box: [63, 1000, 125, 875] },
	{
		point: 'E779',
		segoe: 'ContactInfo',
		fluent: 'person_note_16_regular',
		box: [0, 1000, 188, 875]
	},
	{ point: 'E77A', segoe: 'UnPin', fluent: 'pin_off_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E77C', segoe: 'Memo', fluent: 'voicemail_16_regular', box: [0, 1000, 125, 875] },
	{ point: 'E77F', segoe: 'Paste', fluent: 'clipboard_paste_16_regular', box: [63, 938, 0, 1000] },
	{
		point: 'E780',
		segoe: 'PhoneBook',
		fluent: 'book_contacts_16_regular',
		box: [125, 875, 0, 1000]
	},
	{ point: 'E786', segoe: 'SlideShow', fluent: 'slide_play_20_regular', box: [0, 1000, 63, 938] },
	{ point: 'E78A', segoe: 'Trim', fluent: 'video_clip_16_regular', box: [0, 1000, 63, 938] },
	{ point: 'E78B', segoe: 'NewWindow', fluent: 'window_new_16_regular', box: [0, 938, 63, 875] },
	{
		point: 'E78C',
		segoe: 'SaveLocal',
		fluent: 'save_arrow_right_20_regular',
		box: [63, 1000, 0, 938]
	},
	{ point: 'E7A6', segoe: 'Redo', fluent: 'arrow_redo_16_regular', box: [63, 875, 0, 1000] },
	{ point: 'E7A7', segoe: 'Undo', fluent: 'arrow_undo_16_regular', box: [125, 938, 0, 1000] },
	{ point: 'E7A8', segoe: 'Crop', fluent: 'crop_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E7AC', segoe: 'OpenWith', fluent: 'open_16_regular', box: [63, 1000, 0, 938] },
	{
		point: 'E7AD',
		segoe: 'Rotate',
		fluent: 'arrow_rotate_clockwise_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E7B5',
		segoe: 'SetLockScreen',
		fluent: 'lock_closed_16_regular',
		box: [0, 1000, 0, 875]
	},
	{ point: 'E7B7', segoe: 'MapPin', fluent: 'location_16_regular', box: [250, 688, 0, 1000] },
	{ point: 'E7C1', segoe: 'Flag', fluent: 'flag_16_regular', box: [63, 875, 0, 938] },
	{ point: 'E7C3', segoe: 'Page2', fluent: 'document_16_regular', box: [125, 875, 0, 1000] },
	{
		point: 'E7C5',
		segoe: 'BrowsePhotos',
		fluent: 'image_search_20_regular',
		box: [0, 938, 0, 938]
	},
	{
		point: 'E7C9',
		segoe: 'TouchPointer',
		fluent: 'tap_single_20_regular',
		box: [0, 1000, 63, 859]
	},
	{ point: 'E7E6', segoe: 'Highlight', fluent: 'highlight_16_regular', box: [63, 938, 0, 1000] },
	{
		point: 'E7EE',
		segoe: 'OtherUser',
		fluent: 'person_circle_16_regular',
		box: [63, 1000, 0, 938]
	},
	{ point: 'E7EF', segoe: 'Admin', fluent: 'window_shield_16_regular', box: [63, 1000, 0, 938] },
	{
		point: 'E7F0',
		segoe: 'ClosedCaption',
		fluent: 'closed_caption_16_regular',
		box: [0, 1000, 125, 875]
	},
	{ point: 'E80F', segoe: 'Home', fluent: 'home_16_regular', box: [63, 938, 63, 1000] },
	{ point: 'E823', segoe: 'Clock', fluent: 'clock_16_regular', box: [0, 938, 63, 1000] },
	{ point: 'E890', segoe: 'View', fluent: 'eye_16_regular', box: [16, 984, 188, 813] },
	{ point: 'E892', segoe: 'Previous', fluent: 'previous_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E893', segoe: 'Next', fluent: 'next_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E895', segoe: 'Sync', fluent: 'arrow_sync_16_regular', box: [0, 1000, 0, 1000] },
	{
		point: 'E896',
		segoe: 'Download',
		fluent: 'arrow_download_16_regular',
		box: [125, 813, 0, 1000]
	},
	{ point: 'E897', segoe: 'Help', fluent: 'question_16_regular', box: [250, 750, 63, 938] },
	{ point: 'E898', segoe: 'Upload', fluent: 'arrow_upload_16_regular', box: [125, 813, 0, 1000] },
	{ point: 'E899', segoe: 'Emoji', fluent: 'emoji_laugh_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E89A', segoe: 'TwoPage', fluent: 'book_open_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E89B',
		segoe: 'LeaveChat',
		fluent: 'chat_arrow_back_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E89C',
		segoe: 'MailForward',
		fluent: 'mail_arrow_forward_16_regular',
		box: [0, 1000, 0, 875]
	},
	{
		point: 'E89E',
		segoe: 'RotateCamera',
		fluent: 'camera_switch_20_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E89F',
		segoe: 'ClosePane',
		fluent: 'panel_right_contract_16_regular',
		box: [0, 1000, 125, 875]
	},
	{
		point: 'E8A0',
		segoe: 'OpenPane',
		fluent: 'panel_left_expand_16_regular',
		box: [0, 1000, 125, 875]
	},
	{
		point: 'E8A1',
		segoe: 'PreviewLink',
		fluent: 'preview_link_16_regular',
		box: [0, 1000, 63, 938]
	},
	{ point: 'E8A2', segoe: 'AttachCamera', fluent: 'camera_16_regular', box: [0, 1000, 109, 875] },
	{ point: 'E8A3', segoe: 'ZoomIn', fluent: 'zoom_in_16_regular', box: [63, 938, 63, 938] },
	{
		point: 'E8A4',
		segoe: 'Bookmarks',
		fluent: 'text_bullet_list_ltr_16_regular',
		box: [0, 1000, 219, 844]
	},
	{ point: 'E8A5', segoe: 'Document', fluent: 'document_16_regular', box: [125, 875, 0, 1000] },
	{
		point: 'E8A6',
		segoe: 'ProtectedDocument',
		fluent: 'document_lock_16_regular',
		box: [0, 875, 0, 1000]
	},
	{ point: 'E8A8', segoe: 'MailFilled', fluent: 'mail_16_filled', box: [31, 969, 94, 844] },
	{ point: 'E8A9', segoe: 'ViewAll', fluent: 'grid_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E8AA', segoe: 'VideoChat', fluent: 'video_chat_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8AB', segoe: 'Switch', fluent: 'arrow_swap_16_regular', box: [125, 875, 0, 1000] },
	{ point: 'E8AC', segoe: 'Rename', fluent: 'rename_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8AD', segoe: 'Go', fluent: 'arrow_up_right_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E8AF', segoe: 'Remote', fluent: 'remote_16_regular', box: [125, 875, 0, 1000] },
	{ point: 'E8B1', segoe: 'Shuffle', fluent: 'arrow_shuffle_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E8B3',
		segoe: 'SelectAll',
		fluent: 'select_all_on_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E8B4',
		segoe: 'Orientation',
		fluent: 'orientation_20_regular',
		box: [0, 1000, 125, 875]
	},
	{ point: 'E8B5', segoe: 'Import', fluent: 'arrow_import_16_regular', box: [0, 1000, 188, 875] },
	{
		point: 'E8B6',
		segoe: 'ImportAll',
		fluent: 'chevron_double_right_16_regular',
		box: [0, 1000, 188, 875]
	},
	{ point: 'E8B7', segoe: 'Folder', fluent: 'folder_16_regular', box: [0, 1000, 63, 938] },
	{ point: 'E8B8', segoe: 'WebCam', fluent: 'video_person_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E8B9',
		segoe: 'Pictures',
		fluent: 'image_multiple_16_regular',
		box: [63, 938, 63, 938]
	},
	{ point: 'E8BA', segoe: 'Caption', fluent: 'image_16_regular', box: [125, 875, 31, 1000] },
	{
		point: 'E8BC',
		segoe: 'ShowResults',
		fluent: 'text_bullet_list_ltr_16_regular',
		box: [0, 1000, 125, 906]
	},
	{ point: 'E8BD', segoe: 'Message', fluent: 'chat_16_regular', box: [0, 1000, 0, 1000] },
	{
		point: 'E8BF',
		segoe: 'CalendarDay',
		fluent: 'calendar_day_16_regular',
		box: [63, 938, 63, 938]
	},
	{
		point: 'E8C0',
		segoe: 'CalendarWeek',
		fluent: 'calendar_work_week_16_regular',
		box: [63, 938, 63, 938]
	},
	{ point: 'E8C1', segoe: 'Character', fluent: 'text_font_16_regular', box: [63, 938, 63, 1000] },
	{
		point: 'E8C2',
		segoe: 'MailReplyAll',
		fluent: 'mail_arrow_double_back_16_regular',
		box: [0, 1000, 0, 875]
	},
	{ point: 'E8C3', segoe: 'Read', fluent: 'mail_read_16_regular', box: [0, 1000, 63, 938] },
	{ point: 'E8C4', segoe: 'ShowBcc', fluent: 'chevron_down_16_regular', box: [0, 1000, 250, 813] },
	{ point: 'E8C5', segoe: 'HideBcc', fluent: 'chevron_up_16_regular', box: [0, 1000, 438, 625] },
	{ point: 'E8C6', segoe: 'Cut', fluent: 'cut_16_regular', box: [63, 938, 0, 1000] },
	{ point: 'E8C8', segoe: 'Copy', fluent: 'copy_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E8C9', segoe: 'Important', fluent: 'important_16_regular', box: [313, 688, 0, 1000] },
	{ point: 'E8CA', segoe: 'MailReply', fluent: 'mail_arrow_up_16_regular', box: [0, 1000, 0, 875] },
	{ point: 'E8CB', segoe: 'Sort', fluent: 'arrow_sort_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E8CD',
		segoe: 'DisconnectDrive',
		fluent: 'plug_disconnected_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{ point: 'E8CE', segoe: 'MapDrive', fluent: 'map_drive_16_regular', box: [0, 938, 125, 875] },
	{
		point: 'E8CF',
		segoe: 'ContactPresence',
		fluent: 'person_available_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{ point: 'E8D0', segoe: 'Priority', fluent: 'important_16_regular', box: [0, 875, 0, 1000] },
	{
		point: 'E8D1',
		segoe: 'GoToToday',
		fluent: 'calendar_today_16_regular',
		box: [63, 938, 0, 938]
	},
	{ point: 'E8D2', segoe: 'Font', fluent: 'text_font_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8D3', segoe: 'FontColor', fluent: 'text_color_16_regular', box: [63, 938, 0, 1000] },
	{ point: 'E8D4', segoe: 'Contact2', fluent: 'person_square_16_regular', box: [63, 938, 63, 938] },
	{ point: 'E8D6', segoe: 'Audio', fluent: 'music_note_2_16_regular', box: [63, 875, 0, 1000] },
	{ point: 'E8D7', segoe: 'Permissions', fluent: 'key_16_regular', box: [0, 1000, 0, 1000] },
	{
		point: 'E8D8',
		segoe: 'DisableUpdates',
		fluent: 'arrow_sync_off_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{ point: 'E8D9', segoe: 'UnFavorite', fluent: 'star_off_16_regular', box: [0, 1000, 0, 1000] },
	{
		point: 'E8DA',
		segoe: 'OpenLocal',
		fluent: 'folder_arrow_up_16_regular',
		box: [0, 1000, 0, 938]
	},
	{ point: 'E8DB', segoe: 'Italic', fluent: 'text_italic_16_regular', box: [94, 906, 63, 938] },
	{
		point: 'E8DC',
		segoe: 'Underline',
		fluent: 'text_underline_16_regular',
		box: [188, 813, 63, 938]
	},
	{ point: 'E8DD', segoe: 'Bold', fluent: 'text_bold_16_regular', box: [188, 797, 63, 938] },
	{
		point: 'E8DE',
		segoe: 'MoveToFolder',
		fluent: 'folder_arrow_right_16_regular',
		box: [0, 1000, 0, 938]
	},
	{
		point: 'E8DF',
		segoe: 'LikeDislike',
		fluent: 'thumb_like_dislike_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{ point: 'E8E0', segoe: 'Dislike', fluent: 'thumb_dislike_16_regular', box: [63, 875, 0, 1000] },
	{ point: 'E8E1', segoe: 'Like', fluent: 'thumb_like_16_regular', box: [63, 875, 0, 1000] },
	{
		point: 'E8E2',
		segoe: 'AlignRight',
		fluent: 'text_align_right_16_regular',
		box: [0, 1000, 188, 875]
	},
	{
		point: 'E8E3',
		segoe: 'AlignCenter',
		fluent: 'text_align_center_16_regular',
		box: [0, 1000, 188, 875]
	},
	{
		point: 'E8E4',
		segoe: 'AlignLeft',
		fluent: 'text_align_left_16_regular',
		box: [0, 1000, 188, 875]
	},
	{
		point: 'E8E5',
		segoe: 'OpenFile',
		fluent: 'document_arrow_right_16_regular',
		box: [0, 875, 0, 1000]
	},
	{
		point: 'E8E6',
		segoe: 'ClearSelection',
		fluent: 'select_object_16_regular',
		box: [63, 1000, 0, 938]
	},
	{
		point: 'E8E7',
		segoe: 'FontDecrease',
		fluent: 'font_decrease_20_regular',
		box: [250, 938, 188, 938]
	},
	{
		point: 'E8E8',
		segoe: 'FontIncrease',
		fluent: 'font_increase_20_regular',
		box: [250, 938, 188, 938]
	},
	{
		point: 'E8E9',
		segoe: 'FontSize',
		fluent: 'text_font_size_16_regular',
		box: [0, 1000, 125, 938]
	},
	{ point: 'E8EA', segoe: 'CellPhone', fluent: 'phone_16_regular', box: [188, 813, 0, 1000] },
	{ point: 'E8EB', segoe: 'ReShare', fluent: 'arrow_sync_16_regular', box: [0, 1000, 63, 938] },
	{ point: 'E8EC', segoe: 'Tag', fluent: 'tag_16_regular', box: [31, 1000, 31, 1000] },
	{
		point: 'E8ED',
		segoe: 'RepeatOne',
		fluent: 'arrow_repeat_1_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E8EE',
		segoe: 'RepeatAll',
		fluent: 'arrow_repeat_all_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{ point: 'E8EF', segoe: 'Calculator', fluent: 'calculator_16_regular', box: [125, 875, 0, 1000] },
	{ point: 'E8F0', segoe: 'Directions', fluent: 'directions_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8F1', segoe: 'Library', fluent: 'library_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8F3', segoe: 'PostUpdate', fluent: 'news_16_regular', box: [0, 1000, 188, 813] },
	{ point: 'E8F4', segoe: 'NewFolder', fluent: 'folder_add_16_regular', box: [0, 1000, 0, 938] },
	{
		point: 'E8F5',
		segoe: 'CalendarReply',
		fluent: 'calendar_reply_16_regular',
		box: [63, 1000, 0, 938]
	},
	{
		point: 'E8F6',
		segoe: 'UnSyncFolder',
		fluent: 'folder_prohibited_16_regular',
		box: [0, 1000, 0, 938]
	},
	{ point: 'E8F7', segoe: 'SyncFolder', fluent: 'folder_sync_16_regular', box: [0, 1000, 0, 938] },
	{
		point: 'E8F8',
		segoe: 'BlockContact',
		fluent: 'person_prohibited_16_regular',
		box: [0, 1000, 0, 1000]
	},
	{
		point: 'E8F9',
		segoe: 'SwitchApps',
		fluent: 'window_multiple_16_regular',
		box: [0, 1000, 188, 813]
	},
	{ point: 'E8FA', segoe: 'AddFriend', fluent: 'person_add_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E8FC', segoe: 'GoToStart', fluent: 'grid_dots_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E8FD',
		segoe: 'Bullets',
		fluent: 'text_bullet_list_ltr_16_regular',
		box: [0, 1000, 219, 844]
	},
	{ point: 'E8FE', segoe: 'Scan', fluent: 'scan_16_regular', box: [0, 1000, 125, 1000] },
	{ point: 'E8FF', segoe: 'Preview', fluent: 'scan_dash_16_regular', box: [125, 875, 0, 1000] },
	{
		point: 'E904',
		segoe: 'ZeroBars',
		fluent: 'cellular_data_5_20_filled',
		box: [0, 938, 125, 875]
	},
	{ point: 'E905', segoe: 'OneBar', fluent: 'cellular_data_4_20_filled', box: [0, 938, 125, 875] },
	{ point: 'E906', segoe: 'TwoBars', fluent: 'cellular_data_3_20_filled', box: [0, 938, 125, 875] },
	{
		point: 'E907',
		segoe: 'ThreeBars',
		fluent: 'cellular_data_2_20_filled',
		box: [0, 938, 125, 875]
	},
	{
		point: 'E908',
		segoe: 'FourBars',
		fluent: 'cellular_data_1_20_filled',
		box: [0, 938, 125, 875]
	},
	{ point: 'E909', segoe: 'World', fluent: 'earth_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E90A', segoe: 'Comment', fluent: 'comment_16_regular', box: [0, 1000, 0, 938] },
	{ point: 'E90B', segoe: 'MusicInfo', fluent: 'music_note_1_20_regular', box: [0, 1000, 0, 813] },
	{ point: 'E90C', segoe: 'DockLeft', fluent: 'panel_left_16_regular', box: [0, 1000, 125, 875] },
	{ point: 'E90D', segoe: 'DockRight', fluent: 'panel_right_16_regular', box: [0, 1000, 125, 875] },
	{
		point: 'E90E',
		segoe: 'DockBottom',
		fluent: 'panel_bottom_20_regular',
		box: [0, 1000, 125, 875]
	},
	{ point: 'E90F', segoe: 'Repair', fluent: 'wrench_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E910', segoe: 'Account', fluent: 'mention_16_regular', box: [0, 1000, 0, 1000] },
	{ point: 'E912', segoe: 'Manage', fluent: 'toolbox_16_regular', box: [63, 1000, 0, 938] },
	{ point: 'E913', segoe: 'Street', fluent: 'building_16_regular', box: [0, 1000, 125, 875] },
	{ point: 'E97B', segoe: 'SetTile', fluent: 'arrow_up_16_regular', box: [250, 688, 0, 1000] },
	{
		point: 'E990',
		segoe: 'XboxOneConsole',
		fluent: 'xbox_console_20_regular',
		box: [0, 1000, 250, 750]
	},
	{ point: 'EA37', segoe: 'List', fluent: 'text_align_left_16_regular', box: [0, 1000, 125, 938] },
	// Segoe Fluent Icons on the reference guest has no F5F0, where WinUI's `Symbol` table points
	// `Target`, and the browser draws its missing-glyph box; the token's stack draws this row
	// there too. The box is `Clock`'s, E823, a circle like Fluent's target.
	{
		point: 'F5F0',
		segoe: 'Target',
		fluent: 'target_16_regular',
		box: [0, 938, 63, 1000],
		absent: true
	}
];

/**
 * @type {{
 *   point: string, segoe: string, fluent: string, box: number[],
 *   part?: 'holes', with?: string, absent?: boolean
 * }[]}
 */
export const FALLBACK_GLYPHS = [...DRAWN, ...SYMBOLS];

/** The `DRAWN` rows alone, which `C19` holds to the points the components draw. */
export const DRAWN_GLYPHS = DRAWN;

/** The family the token layer names after the two Segoe families. */
export const FALLBACK_FAMILY = 'winui-svelte icons';
