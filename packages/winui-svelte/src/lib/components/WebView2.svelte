<script lang="ts" module>
	export interface WebView2Props {
		/** Source. The URI the control navigates to. */
		source?: string | null;
		/**
		 * DefaultBackgroundColor, as a CSS colour. Upstream paints it behind the hosted document
		 * while that document has no background of its own; an iframe's own background is what
		 * shows in the same places, so this is the same property under the same condition.
		 */
		defaultBackgroundColor?: string;
		/**
		 * AutomationProperties.Name, which for an iframe is the `title` attribute — the only
		 * accessible name a frame has, since its contents are a separate document.
		 */
		title?: string;
		/**
		 * NavigationCompleted. The DOM `load` event of the frame. Measured on the reference guest:
		 * this fires for a document the remote host refuses to let this origin frame, exactly as
		 * it does for one it serves, so it reports "the frame settled" and not "the navigation
		 * succeeded" — `NavigationCompleted`'s own `IsSuccess` has no readable counterpart here.
		 */
		onNavigationCompleted?: (event: Event) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLIFrameElement | null;
		[key: string]: unknown;
	}

	// Deliberately absent: CoreWebView2 and everything reached through it — ExecuteScriptAsync,
	// PostWebMessageAs*, AddScriptToExecuteOnDocumentCreatedAsync, cookies, permissions. The web's
	// same-origin policy withholds these from a frame's embedder by design. CanGoBack, CanGoForward,
	// GoBack(), GoForward(), Reload(), NavigateToString(), and Stop() are also absent: a cross-origin
	// frame's history and location are neither readable nor writable from its embedder, and no Gallery
	// page calls them. NavigationStarting is raised before a navigation this component cannot observe;
	// ContentLoading, WebMessageReceived, and ProcessFailed belong to CoreWebView2. EnsureCoreWebView2Async()
	// and Close() govern a hosted browser-process lifetime, which an iframe does not have.
</script>

<script lang="ts">
	let {
		source = null,
		defaultBackgroundColor,
		title,
		onNavigationCompleted,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: WebView2Props = $props();

	const rootStyle = $derived(
		[defaultBackgroundColor ? `background-color: ${defaultBackgroundColor}` : null, style]
			.filter(Boolean)
			.join('; ') || undefined
	);
</script>

<iframe
	bind:this={ref}
	class={['web-view2', className]}
	src={source ?? undefined}
	{title}
	style={rootStyle}
	onload={onNavigationCompleted}
	{...rest}
></iframe>

<style>
	.web-view2 {
		/* A WebView2 is a Control and stretches in both directions like one; the caller's box is
		   what sizes it, the way `MediaPlayerElement` takes its box from its caller. An iframe's
		   `border` is UA chrome rather than a WinUI resource, so removing it is not a visual
		   literal — there is no theme resource for a border WinUI does not draw. */
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
