<script lang="ts" module>
	export interface PersonPictureProps {
		/** BadgeGlyph. A Segoe Fluent Icons code point, as uppercase hex — `glyph`'s convention. */
		badgeGlyph?: string;
		/** BadgeImageSource, as the URI an `ImageSource` would carry. */
		badgeImageSource?: string;
		/** BadgeNumber. Zero and below draw no badge. */
		badgeNumber?: number;
		/** BadgeText. The word the accessible name uses for the badge. */
		badgeText?: string;
		/** DisplayName. The initials are derived from it when `initials` is not given. */
		displayName?: string;
		/** Initials. */
		initials?: string;
		/** IsGroup. */
		isGroup?: boolean;
		/** ProfilePicture, as the URI an `ImageSource` would carry. */
		profilePicture?: string;
		/** Width and Height, which upstream keeps equal — `PersonPicture.cpp:563-591`. */
		size?: number;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	/** `PersonPicture.xaml:33` — the Segoe Fluent Icons 'Contact' glyph. */
	const PLACEHOLDER_GLYPH = 'E77B';
	/** `PersonPicture.xaml:41` — the Segoe Fluent Icons 'People' glyph. */
	const GROUP_GLYPH = 'E716';

	// PersonPicture.xaml:9-10 starts at 96x96, and PersonPicture.cpp:563-591 makes every size
	// change square using its smaller dimension. The Gallery's Height="300" therefore resolves to
	// 96x96; the reference guest measured the circle at x 370..465 and y 261..356.
	//
	// PersonPicture.cpp:593-615 calculates initials at width * .42, the badge at size * .5, and
	// badge text at badge size * .6. Its max(1.0, ...) floors prevent invalid XAML font sizes; CSS
	// accepts smaller sizes, so the floor is deliberately omitted.
	//
	// PersonPicture.xaml:66 centres a TextLineBounds="Tight" text block. In a 96px circle centred
	// at row 47.5, reference JD ink is rows 35..62 (centre 48.5), flex-centred normal line-height is
	// 37..64 (50.5), and flex-centred `text-box: trim-both cap alphabetic` is 34..61 (47.5). The
	// latter is closest; WinUI's rounded text box accounts for its final one-pixel difference.
	//
	// PersonPicture.cpp:145-153 paints the photo with a centred UniformToFill ImageBrush. The
	// Gallery 225x160 image becomes 135x96, and the reference fit finds a 19.5px centre crop
	// (20px mean absolute difference 9.16; 19px 9.25), unlike Image's start crop in WD-055.
	//
	// PersonPicture.cpp:162-180 chooses Group before photo, initials, and placeholder. This means a
	// group hides a supplied photo. The original template sets AccessibilityView="Raw" despite its
	// composed name; this web reproduction instead exposes role="img" with that name.
	//
	// Deliberately absent: Contact and PreferSmallImage. Contact is a
	// `Windows.ApplicationModel.Contacts.Contact` — PersonPicture.idl:17 — whose display name,
	// initials and up to four picture streams PersonPicture.cpp:409-503 reads, and PreferSmallImage
	// (:436-438) only chooses among those streams. There is no web counterpart to the object, so
	// this component takes the display name, the initials and the picture URI directly.
	// TemplateSettings (PersonPicture.idl:41-45) exposes the two values the template binds to;
	// here they are local derived state rather than a public object.
</script>

<script lang="ts">
	import { initialsFromDisplayName } from '../internal/initials';

	let {
		badgeGlyph,
		badgeImageSource,
		badgeNumber = 0,
		badgeText,
		displayName,
		initials,
		isGroup = false,
		profilePicture,
		size = 96,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PersonPictureProps = $props();

	// PersonPicture.cpp:108-122 prefers a non-empty Initials property over generated initials.
	const shownInitials = $derived(initials || initialsFromDisplayName(displayName ?? ''));
	// PersonPicture.cpp:162-180 gives IsGroup precedence even when a profile picture is supplied.
	const face = $derived(
		isGroup ? 'group' : profilePicture ? 'photo' : shownInitials ? 'initials' : 'placeholder'
	);
	// PersonPicture.cpp:185-245 gives image, non-zero number, then glyph precedence; a non-positive
	// selected number form hides the badge instead of falling through to a glyph.
	const badge = $derived.by(() => {
		if (badgeImageSource) return { kind: 'image' as const };
		if (badgeNumber !== 0) {
			if (badgeNumber <= 0) return null;
			return { kind: 'number' as const, text: badgeNumber <= 99 ? String(badgeNumber) : '99+' };
		}
		return badgeGlyph ? { kind: 'glyph' as const, glyph: badgeGlyph } : null;
	});
	// PersonPicture.cpp:293-407 uses the Initials property rather than derived initials. Its seven
	// en-US plural resources are identical, so only the singular/plural distinction remains.
	const automationName = $derived.by(() => {
		const name = isGroup ? 'Group' : displayName || initials || 'Person';
		if (badgeNumber > 0)
			return `${name}, ${badgeNumber} ${badgeText || (badgeNumber === 1 ? 'item' : 'items')}`;
		// Upstream's automation branch treats a negative number as non-numeric here, even though the
		// visual badge ladder hides it before reaching a glyph (PersonPicture.cpp:326-359).
		if (badgeGlyph || badgeImageSource) return `${name}, ${badgeText || 'icon'}`;
		return name;
	});
	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and gate
	// C9 walks every token a source file reads. These are per-instance computed values.
	const rootStyle = $derived(
		`--person-picture-size:${size}px;` +
			`--person-picture-badge-size:${size * 0.5}px;` +
			(style ?? '')
	);
</script>

<div
	bind:this={ref}
	class={['person-picture', className]}
	style={rootStyle}
	role="img"
	aria-label={automationName}
	{...rest}
>
	<!-- This layer, rather than the root's border, keeps negative badge margins relative to the
	     control's outer edge instead of a border-inset padding box. -->
	<div class="ellipse"></div>
	<!-- PersonPicture.xaml:66-67 keeps text under the photo and covers it; mutually rendering the
	     two makes the same picture with one fewer element. -->
	{#if face === 'photo'}
		<img class="photo" src={profilePicture} alt="" />
	{:else if face === 'initials'}
		<span class="initials">{shownInitials}</span>
	{:else}
		<span class="initials symbol"
			>{String.fromCodePoint(
				Number.parseInt(face === 'group' ? GROUP_GLYPH : PLACEHOLDER_GLYPH, 16)
			)}</span
		>
	{/if}
	{#if badge !== null}
		<div class="badge">
			<div class="badge-plate"></div>
			{#if badge.kind === 'image'}
				<img class="badge-image" src={badgeImageSource} alt="" />
			{:else if badge.kind === 'number'}
				<span class="badge-content">{badge.text}</span>
			{:else}
				<span class="badge-content symbol"
					>{String.fromCodePoint(Number.parseInt(badge.glyph, 16))}</span
				>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* PersonPicture.xaml:11-12 — RootGrid uses the ContentControl font and SemiBold weight. */
	.person-picture {
		position: relative;
		box-sizing: border-box;
		width: var(--person-picture-size);
		height: var(--person-picture-size);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--winui-ContentControlThemeFontFamily);
		/* c1-allow: PersonPicture.xaml:12, FontWeight="SemiBold" */
		font-weight: 600;
		color: var(--winui-PersonPictureForegroundThemeBrush);
	}
	/* PersonPicture.xaml:65 — XAML strokes are inside the element bounds. The fill under one is
	   not: it stops at the stroke's centreline, which is WD-096. */
	.ellipse {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		box-sizing: border-box;
		background: var(--winui-PersonPictureEllipseFillThemeBrush);
		border: var(--winui-PersonPictureEllipseStrokeThickness) solid
			var(--winui-PersonPictureEllipseFillStrokeBrush);
	}
	/* PersonPicture.cpp:593-601 and PersonPicture.xaml:66 — text-box is the measured Tight match. */
	.initials {
		position: relative;
		font-size: calc(var(--person-picture-size) * 0.42);
		line-height: normal;
		text-box: trim-both cap alphabetic;
	}
	/* PersonPicture.xaml:29-43 — both placeholder states use SymbolThemeFontFamily. */
	.symbol {
		font-family: var(--winui-SymbolThemeFontFamily);
	}
	/* PersonPicture.cpp:145-153 — centred UniformToFill differs from Image's WD-055 start crop. */
	.photo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
	/* PersonPicture.xaml:68 and PersonPicture_themeresources.xaml:15 — aligned then margin-shifted. */
	.badge {
		position: absolute;
		top: 0;
		right: 0;
		margin: var(--winui-PersonPictureBadgeGridMargin);
		box-sizing: border-box;
		width: var(--person-picture-badge-size);
		height: var(--person-picture-badge-size);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--winui-PersonPictureEllipseBadgeForegroundThemeBrush);
	}
	/* PersonPicture.xaml:69 — the badge plate carries its own inside stroke, and its fill stops
	   half a pixel inside it: WD-096. */
	.badge-plate {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		box-sizing: border-box;
		background: var(--winui-PersonPictureEllipseBadgeFillThemeBrush);
		border: var(--winui-PersonPictureEllipseBadgeStrokeThickness) solid
			var(--winui-PersonPictureEllipseBadgeStrokeThemeBrush);
	}
	/* PersonPicture.cpp:604-615 — badge text is 60% of the half-size badge. */
	.badge-content {
		position: relative;
		font-size: calc(var(--person-picture-badge-size) * 0.6);
		line-height: normal;
		text-box: trim-both cap alphabetic;
	}
	/* PersonPicture.xaml:58 — BadgeImageSource uses UniformToFill. */
	.badge-image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
</style>
