import { render } from 'svelte/server';
import { Button } from '@harena-hq/winui-svelte';

const { body } = render(Button, { props: {} });

process.stdout.write(body);
