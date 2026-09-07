<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type TeachingTipPlacementMode =
		| 'auto'
		| 'top'
		| 'bottom'
		| 'left'
		| 'right'
		| 'topRight'
		| 'topLeft'
		| 'bottomRight'
		| 'bottomLeft'
		| 'leftTop'
		| 'leftBottom'
		| 'rightTop'
		| 'rightBottom'
		| 'center';

	export type TeachingTipTailVisibility = 'auto' | 'visible' | 'collapsed';

	export type TeachingTipHeroContentPlacementMode = 'auto' | 'top' | 'bottom';

	export interface TeachingTipProps {
		/** Title. */
		title?: string;
		/** Subtitle. */
		subtitle?: string;
		/** Content. The tip's main content, below the title and subtitle. */
		content?: Snippet;
		/** HeroContent. A full-width band above or below everything else. */
		heroContent?: Snippet;
		/** HeroContentPlacement. */
		heroContentPlacement?: TeachingTipHeroContentPlacementMode;
		/**
		 * ActionButtonContent. Upstream takes any object; this takes the button's text, which is
		 * the part of it this library draws.
		 */
		actionButtonContent?: string;
		/** CloseButtonContent. Text, for the same reason as `actionButtonContent`. */
		closeButtonContent?: string;
		/** ActionButtonClick. */
		onActionButtonClick?: () => void;
		/**
		 * PlacementMargin. The inset between an untargeted tip and the viewport's edge. Upstream
		 * reads all four sides of a Thickness; only the one the tip is placed against is visible,
		 * so this is a single number.
		 */
		placementMargin?: number;
		/**
		 * IconSource. A Segoe Fluent Icons code point, as `MenuFlyout` takes one — upstream takes
		 * an `IconSource`, and a glyph is the part of it this library draws.
		 */
		glyph?: string;
		/**
		 * Target. The element the tip points at. Receives the props it must spread. Omit it for an
		 * untargeted tip, which is anchored to the window and has no tail.
		 *
		 * Spread them **first**, before the element's own attributes: they carry the primitive's
		 * event handlers, and a trigger that sets one of the same names after the spread replaces
		 * it rather than adding to it.
		 */
		children?: Snippet<[Record<string, unknown>]>;
		/** PreferredPlacement. */
		preferredPlacement?: TeachingTipPlacementMode;
		/** TailVisibility. */
		tailVisibility?: TeachingTipTailVisibility;
		/** IsLightDismissEnabled. ADR 0009 drops the leading `Is`. */
		lightDismiss?: boolean;
		/** IsOpen. `open` is in ADR 0009's closed HTML-attribute exception set. */
		open?: boolean;
		/** Fired whenever the tip opens or closes, for any reason. */
		onOpenChange?: (open: boolean) => void;
		/** CloseButtonClick, raised by the header close button. */
		onCloseButtonClick?: () => void;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `ActionButtonStyle` and `CloseButtonStyle` are `Style`-typed WinUI members, so they are
	// absent under ADR 0002. The token cascade, class, and style props are the Svelte surface.
	// `ActionButtonCommand`, `ActionButtonCommandParameter`, `CloseButtonCommand`, and
	// `CloseButtonCommandParameter` are WinUI's command pattern; a Svelte consumer uses the click
	// callback instead.
	// `ShouldConstrainToRootBounds` can select a separate upstream window that escapes the app's
	// bounds. A portalled browser element cannot leave the document, so it has no choice to expose.
	// `TemplateSettings` is read-only layout output from the XAML template, computed for the
	// tail's highlight margins, and has no analogue here.
	// Upstream's `Closing` event carries a `Cancel` flag and a deferral; `onOpenChange` cannot
	// express either. A consumer that must veto a close holds `open` itself.
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import Button from './Button.svelte';

	let {
		title,
		subtitle,
		glyph,
		content,
		heroContent,
		heroContentPlacement = 'auto',
		actionButtonContent,
		closeButtonContent,
		onActionButtonClick,
		placementMargin = 0,
		children,
		preferredPlacement = 'auto',
		tailVisibility = 'auto',
		lightDismiss = false,
		open = $bindable(false),
		onOpenChange,
		onCloseButtonClick,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TeachingTipProps = $props();

	const CLOSE_GLYPH = String.fromCodePoint(parseInt('E711', 16));

	const placements = {
		top: { side: 'top', align: 'center' },
		bottom: { side: 'bottom', align: 'center' },
		left: { side: 'left', align: 'center' },
		right: { side: 'right', align: 'center' },
		topRight: { side: 'top', align: 'start' },
		topLeft: { side: 'top', align: 'end' },
		bottomRight: { side: 'bottom', align: 'start' },
		bottomLeft: { side: 'bottom', align: 'end' },
		leftTop: { side: 'left', align: 'end' },
		leftBottom: { side: 'left', align: 'start' },
		rightTop: { side: 'right', align: 'end' },
		rightBottom: { side: 'right', align: 'start' },
		center: { side: 'top', align: 'center' },
		auto: { side: 'top', align: 'center' }
	} as const;

	// The *Right/*Left and *Top/*Bottom rows read backwards on purpose: upstream names the
	// placement for the tail, while the card grows the other way. `TopRight` puts the tail at
	// `HorizontalAlignment="Left"` (TeachingTip.xaml:166), which is floating-ui's `start`.
	// `center` and `auto` both resolve to top-centre because their upstream visual states are
	// identical and collision avoidance is enabled for every placement, as in Flyout.svelte.
	const position = $derived(placements[preferredPlacement]);

	let anchor = $state<HTMLElement | null>(null);

	const targeted = $derived(children !== undefined);
	// `Untargeted` (TeachingTip.xaml:259) collapses the tail whatever `TailVisibility` says.
	const showTail = $derived(targeted && tailVisibility !== 'collapsed');
	const footerCloseButton = $derived(closeButtonContent !== undefined);
	const buttonCount = $derived(
		[actionButtonContent, closeButtonContent].filter((text) => text !== undefined).length
	);

	function closeFromButton() {
		onCloseButtonClick?.();
		open = false;
	}

	function actionClick() {
		// Upstream's ActionButtonClick raises the event and leaves IsOpen alone.
		onActionButtonClick?.();
	}

	function closeFromFooter() {
		onCloseButtonClick?.();
		open = false;
	}
</script>

{#if !targeted}
	<div class="anchor" bind:this={anchor} aria-hidden="true"></div>
{/if}

<Popover.Root
	bind:open={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
		}
	}
>
	{#if children}
		<Popover.Trigger>
			{#snippet child({ props })}
				{@render children(props)}
			{/snippet}
		</Popover.Trigger>
	{/if}
	<Popover.Portal>
		<!-- The gap between a targeted card and its target is TeachingTipTailShortSideLength —
		     the outer Grid's 8px tail track (TeachingTip.xaml:282,
		     TeachingTip_themeresources.xaml:93), and the 8px the reference measures from the
		     card's bottom edge to the target's top edge. bits-ui offsets by
		     `sideOffset + the arrow element's measured height` (use-floating-layer.svelte.js:89),
		     so the 8 is asked for in whichever of the two terms is not already there: the tail is
		     8 tall, and a collapsed tail is no element at all. Upstream keeps the track either way
		     — it is a Grid row, not the tail. An untargeted tip is centred against a viewport-wide
		     anchor at the bottom of the window and offset by PlacementMargin; collision avoidance
		     is off because that anchor already is the viewport. -->
		<Popover.Content
			side={targeted ? position.side : 'top'}
			align={targeted ? position.align : 'center'}
			sideOffset={targeted ? (showTail ? 0 : 8) : placementMargin}
			customAnchor={targeted ? null : anchor}
			avoidCollisions={targeted}
			trapFocus={false}
			onOpenAutoFocus={(event) => event.preventDefault()}
			interactOutsideBehavior={lightDismiss ? 'close' : 'ignore'}
			escapeKeydownBehavior={lightDismiss ? 'close' : 'ignore'}
		>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div
						{...props}
						bind:this={ref}
						class={['card', 'winui-BodyTextBlockStyle', className]}
						data-light-dismiss={lightDismiss ? '' : undefined}
						data-footer-close={footerCloseButton ? '' : undefined}
						{style}
						{...rest}
					>
						{#if heroContent}
							<div class="hero" data-placement={heroContentPlacement}>
								{@render heroContent()}
							</div>
						{/if}
						<div class="panel">
							<div class="scroll">
								<div class="body">
									<div class="header">
										{#if glyph}
											<span class="icon" aria-hidden="true"
												>{String.fromCodePoint(parseInt(glyph, 16))}</span
											>
										{/if}
										<div class="titles">
											{#if title}<div class="title winui-BodyStrongTextBlockStyle">
													{title}
												</div>{/if}
											{#if subtitle}<div class="subtitle">{subtitle}</div>{/if}
										</div>
									</div>
									{#if content}
										<!-- WD-017: the shipped control puts no margin above the content slot. -->
										<div class="main">{@render content()}</div>
									{/if}
									{#if buttonCount > 0}
										<div class="commands" data-count={buttonCount}>
											{#if actionButtonContent !== undefined}
												<Button class="action" onclick={actionClick}>{actionButtonContent}</Button>
											{/if}
											{#if closeButtonContent !== undefined}
												<Button class="close-button" onclick={closeFromFooter}
													>{closeButtonContent}</Button
												>
											{/if}
										</div>
									{/if}
								</div>
							</div>
							<!-- The close button is the NonHeroContentRootGrid's second child, so it stays
							     outside the ScrollViewer and is positioned from the panel's top. -->
							{#if !footerCloseButton}
								<!-- CloseButtonLocations.FooterCloseButton (TeachingTip.xaml:75) leaves no
								     header close button when the command row supplies one. -->
								<button type="button" class="close" aria-label="Close" onclick={closeFromButton}>
									<span class="close-fill" aria-hidden="true">{CLOSE_GLYPH}</span>
								</button>
							{/if}
						</div>
						<!-- `auto` and `visible` are identical here for targeted tips; only `collapsed`
						     removes the tail, and Untargeted removes it regardless. -->
						{#if showTail}
							<Popover.Arrow>
								{#snippet child({ props })}
									<span {...props} class="tail">
										<svg viewBox="0 2 20 8" width="20" height="8" aria-hidden="true">
											<polyline points="0,0 10,10 20,0" />
										</svg>
									</span>
								{/snippet}
							</Popover.Arrow>
						{/if}
					</div>
				</div>
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style>
	/* A zero-height fixed element at the viewport edge gives an untargeted Popover a measurable
	   anchor without taking space in the Gallery's document flow. */
	.anchor {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 0;
		pointer-events: none;
	}

	/* TeachingTip.xaml:312 — ContentRootGrid, the box that carries the border, the fill and the
	   corner radius. position:relative contains the absolutely positioned Popover.Arrow, and the
	   card must not clip the tail.

	   No `padding-box` on the fill, unlike every other surface in this library: `:312` declares
	   no `BackgroundSizing`, so the default `OuterBorderEdge` is what upstream draws and CSS's
	   default `border-box` is already it.

	   WD-012: WinUI's popup host casts this card's ThemeShadow. No pinned resource states its
	   recipe, so this portalled surface deliberately draws no `box-shadow`; see
	   docs/divergences.md. */
	.card {
		position: relative;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		/* TeachingTip.xaml:282 and TeachingTip_themeresources.xaml:74, :93: the outer 336px
		   maximum spans two 8px tail tracks, leaving a 320px card. The floating wrapper's
		   min-width:max-content interaction at this cap is unverified and belongs to 046b. */
		max-width: calc(var(--winui-TeachingTipMaxWidth) - 16px);
		/* TeachingTip_themeresources.xaml:72 — the maximum height. */
		max-height: var(--winui-TeachingTipMaxHeight);
		/* TeachingTip_themeresources.xaml:71 — keep the shipped minimum height. */
		min-height: var(--winui-TeachingTipMinHeight);
		/* WD-016: the shipped reference ignores TeachingTipMinWidth, so content sizes the card;
		   consumers who need the documented floor can provide min-width through style or class. */
		border-style: solid;
		border-width: var(--winui-TeachingTipContentBorderThicknessUntargeted);
		border-color: var(--winui-TeachingTipBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		background: var(--winui-TeachingTipBackgroundBrush);
		color: var(--winui-TeachingTipForegroundBrush);
		outline: none;
	}

	/* TeachingTip's light-dismiss visual state uses the transient background resource. */
	.card[data-light-dismiss] {
		background: var(--winui-TeachingTipTransientBackground);
	}

	.hero {
		flex: none;
		/* HeroContentPlacementStates (TeachingTip.xaml:101) moves this band between the first
		   and last content rows; `order` is the CSS equivalent of those Grid.Row values. */
		order: 0;
		overflow: hidden;
		/* The radius is the card radius minus its border width, so the image meets the inner
		   card corner rather than rounding against the outer border. */
		border-radius: calc(
				var(--winui-OverlayCornerRadius) - var(--winui-TeachingTipContentBorderThicknessUntargeted)
			)
			calc(
				var(--winui-OverlayCornerRadius) - var(--winui-TeachingTipContentBorderThicknessUntargeted)
			)
			0 0;
	}

	.hero[data-placement='bottom'],
	.card[data-side='bottom'] .hero[data-placement='auto'] {
		/* The explicit `bottom` and inferred bottom-side `auto` cases are disjoint. */
		order: 1;
		border-radius: 0 0
			calc(
				var(--winui-OverlayCornerRadius) - var(--winui-TeachingTipContentBorderThicknessUntargeted)
			)
			calc(
				var(--winui-OverlayCornerRadius) - var(--winui-TeachingTipContentBorderThicknessUntargeted)
			);
	}

	/* TeachingTip.xaml:319 — NonHeroContentRootGrid contains the scroll view and close button. */
	.panel {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}

	/* TeachingTip.xaml:320 — ScrollViewer owns vertical overflow and does not include the close
	   button, which is the panel's second child. */
	.scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}

	/* TeachingTip.xaml:321 — the padded StackPanel; 12px is TeachingTipContentMargin. */
	.body {
		padding: var(--winui-TeachingTipContentMargin);
	}

	/* TeachingTip.xaml:327 — the icon and titles share a row. Centering aligns the icon with both
	   text lines: their 239..276 block and the icon's 257.5px ink centre coincide. */
	.header {
		display: flex;
		align-items: center;
	}

	/* The card carries `winui-BodyTextBlockStyle`, whose generated `line-height` is 20px, and
	   nothing upstream sets a line height on `MainContentPresenter` (TeachingTip.xaml:335) — a
	   TextBlock there uses the font's own spacing, which the reference measures at 19. Without
	   this the card is 311 tall against the original's 310. */
	.main {
		line-height: normal;
	}

	.commands {
		display: grid;
		/* The reference's natural buttons are 110px and 104px wide. `auto auto` keeps those
		   natural widths in a tight row and shares surplus like upstream's two star columns;
		   `1fr 1fr` would make both tracks the wider button and the card six pixels too wide. */
		grid-template-columns: auto auto;
	}

	.commands[data-count='1'] {
		grid-template-columns: auto;
	}

	/* `Button` is a child component, so its root does not carry this component's scope class;
	   every selector here that targets a Button must go through `:global()`. These margins carry
	   the 12px above the row: TeachingTipLeftButtonMargin is XAML `0,12,4,0`, emitted as
	   `12px 4px 0px 0px`, and the right token is the corresponding `12px 0px 0px 4px`. */
	.commands > :global(.action) {
		margin: var(--winui-TeachingTipLeftButtonMargin);
	}

	.commands > :global(.close-button) {
		margin: var(--winui-TeachingTipRightButtonMargin);
	}

	/* The global selector reaches a Button component's root. A lone command uses the upstream
	   TeachingTipButtonPanelMargin, including its 12px top gap, instead of a separate row margin. */
	.commands[data-count='1'] > :global(*) {
		margin: var(--winui-TeachingTipButtonPanelMargin);
	}

	/* TeachingTip.xaml:327 and the reference's 20x20 icon measurement. */
	.icon {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		/* TeachingTip_themeresources.xaml:82 — the icon-to-title gap is 12px. */
		margin: var(--winui-TeachingTipIconPresenterMarginWithIcon);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: `SymbolIcon`'s own default FontSize, which no TeachingTip resource states;
		   the reference renders the tip's icon 20x20. */
		font-size: 20px;
		line-height: normal;
	}

	/* TeachingTip.xaml:330 and TeachingTip_themeresources.xaml:80 — reserve the header close
	   button's 28px title margin. min-width:0 lets long subtitles shrink inside the card. */
	.titles {
		flex: 1 1 auto;
		min-width: 0;
		margin: var(--winui-TeachingTipTitleStackPanelMarginWithHeaderCloseButton);
	}

	.card[data-footer-close] .titles {
		/* TeachingTip_themeresources.xaml:81 sets this footer-close margin to 0,0,0,0. The
		   generated layer does not emit the named resource, so the equivalent zero inset is used. */
		margin: 0;
	}

	/* TeachingTip.xaml:331 — title foreground; the type-ramp class supplies its text metrics. */
	.title {
		color: var(--winui-TeachingTipTitleForegroundBrush);
		line-height: normal;
	}

	/* TeachingTip.xaml:332 — subtitle foreground and native line spacing. */
	.subtitle {
		color: var(--winui-TeachingTipSubtitleForegroundBrush);
		line-height: normal;
	}

	/* TeachingTip.xaml:350 and TeachingTip_themeresources.xaml:95 — the alternate close button is
	   flush with the panel's top-right corner. */
	.close {
		position: absolute;
		top: 0;
		right: 0;
		box-sizing: border-box;
		width: var(--winui-TeachingTipAlternateCloseButtonSize);
		height: var(--winui-TeachingTipAlternateCloseButtonSize);
		/* TeachingTip_themeresources.xaml:101 — AlternateCloseButtonStyle padding is 4px. */
		padding: 4px;
		border: none;
		background: none;
	}

	/* TeachingTip_themeresources.xaml:95 and :96 — the 40px box and the 16px glyph — and :101,
	   the `AlternateCloseButtonStyle` the three state rules below read. */
	.close-fill {
		box-sizing: border-box;
		display: flex;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
		border-style: solid;
		border-width: var(--winui-TeachingTipAlternateCloseButtonBorderThickness);
		border-color: var(--winui-TeachingTipAlternateCloseButtonBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TeachingTipAlternateCloseButtonBackground);
		color: var(--winui-TeachingTipAlternateCloseButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-TeachingTipAlternateCloseButtonGlyphSize);
		line-height: normal;
	}

	/* TeachingTip_themeresources.xaml:101 — pointer-over close-button resources. */
	.close:hover .close-fill {
		background: var(--winui-TeachingTipAlternateCloseButtonBackgroundPointerOver);
		border-color: var(--winui-TeachingTipAlternateCloseButtonBorderBrushPointerOver);
		color: var(--winui-TeachingTipAlternateCloseButtonForegroundPointerOver);
	}

	/* TeachingTip_themeresources.xaml:101 — pressed close-button resources. */
	.close:active .close-fill {
		background: var(--winui-TeachingTipAlternateCloseButtonBackgroundPressed);
		border-color: var(--winui-TeachingTipAlternateCloseButtonBorderBrushPressed);
		color: var(--winui-TeachingTipAlternateCloseButtonForegroundPressed);
	}

	/* No `:disabled` rule. `AlternateCloseButtonStyle` defines a Disabled state
	   (TeachingTip_themeresources.xaml:101) and `AlternateCloseButton` (TeachingTip.xaml:350)
	   binds nothing to `IsEnabled`, so the state is unreachable upstream and there is no prop
	   here that would reach it either. Its three `...Disabled` tokens are emitted and unread,
	   which is a dictionary record rather than a hole. A rule no markup can enter is the defect
	   this project has already paid for twice. */

	/* TeachingTip.xaml:353 and the measured tail geometry: the span is 20px wide and its visible
	   8px height is the outside portion of the 20x10 triangle. */
	.tail {
		display: block;
		width: 20px;
		height: 8px;
	}

	/* TeachingTip.xaml:353 and the measured rows 289..296. The `0 2 20 8` viewBox shows only
	   the outer eight of the ten rows the triangle spans, and an svg clips to its viewport, so
	   the two rows that live inside the card are never painted. The svg needs no pull of its
	   own: an absolutely positioned element resolves its offsets against its containing block's
	   *padding* box, so bits-ui's `bottom: 0` already starts the tail one border-width inside
	   the card — which is exactly the row whose border the tail has to paint out. */
	.tail svg {
		display: block;
	}

	/* TeachingTip.xaml:353 — polyline fills as a closed shape but strokes only its two slanted
	   segments, so the tail base has no border line. */
	.tail polyline {
		fill: var(--winui-TeachingTipBackgroundBrush);
		stroke: var(--winui-TeachingTipBorderBrush);
		stroke-width: var(--winui-TeachingTipBorderThickness);
	}

	/* The light-dismiss state changes the tail fill with the card. */
	.card[data-light-dismiss] .tail polyline {
		fill: var(--winui-TeachingTipTransientBackground);
	}
</style>
