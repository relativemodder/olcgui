import { mock } from 'bun:test';

mock.module('$env/dynamic/private', () => ({
	env: process.env
}));
