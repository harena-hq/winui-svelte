import { render } from 'svelte/server';
import { Button } from 'winui-svelte';

const { body } = render(Button, { props: {} });

process.stdout.write(body);
