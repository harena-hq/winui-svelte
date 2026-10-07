/**
 * The naming attributes a component routes to its control when its root is not the control.
 *
 * ADR 0009 puts the rest props on the root, which is right for an `id`, a `data-*` hook or a
 * pointer handler and wrong for a name: on a wrapper `<div>` an `aria-label` names nothing a
 * screen reader reads. A component whose control is an inner element declares these three and
 * hands them to `controlName`, whose result it spreads on the control.
 */
export interface AccessibleNameProps {
	/** AutomationProperties.Name. Names the control, over its header. */
	'aria-label'?: string;
	/** AutomationProperties.LabeledBy, as the ids of the labelling elements. */
	'aria-labelledby'?: string;
	/** Ids of the elements describing the control. */
	'aria-describedby'?: string;
}

/**
 * The control's naming attributes, resolved in upstream's order: `AutomationProperties.Name`,
 * then `LabeledBy`, then the control's own — its header
 * (`FrameworkElementAutomationPeer::GetNameCore`, FrameworkElementAutomationPeer_partial.cpp:440,
 * which falls through to the control's own peer for the header).
 *
 * ARIA ranks the other way — `aria-labelledby` over `aria-label` — so a consumer's `aria-label`
 * has to clear the component's own `aria-labelledby` rather than sit beside it, or the header
 * would go on winning.
 *
 * `own` is the space-separated ids the control would be labelled by on its own, or `undefined`.
 */
export function controlName(props: AccessibleNameProps, own: string | undefined) {
	const { label, labelledby } = nameSource(props);
	return {
		'aria-label': label,
		'aria-labelledby': label !== undefined ? undefined : (labelledby ?? own),
		'aria-describedby': props['aria-describedby']
	};
}

/**
 * The consumer's name, if they gave one. An empty or blank value is no name: upstream checks
 * each source for zero length before falling through to the next
 * (FrameworkElementAutomationPeer_partial.cpp:452, :463). Taken as given, an `aria-label=""`
 * would clear the header and name nothing.
 */
export function nameSource(props: AccessibleNameProps) {
	const label = props['aria-label']?.trim() ? props['aria-label'] : undefined;
	const labelledby = props['aria-labelledby']?.trim() ? props['aria-labelledby'] : undefined;
	return { label, labelledby };
}
