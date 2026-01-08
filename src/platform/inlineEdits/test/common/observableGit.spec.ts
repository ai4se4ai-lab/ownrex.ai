/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, assert, beforeEach, suite, test, vi } from 'vitest';
import { Emitter, Event } from '../../../../util/vs/base/common/event';
import { URI } from '../../../../util/vs/base/common/uri';
import { IGitExtensionService } from '../../../git/common/gitExtensionService';
import { API, Branch, Repository, RepositoryState } from '../../../git/vscode/git';
import { ObservableGit } from '../../common/observableGit';

suite('ObservableGit', () => {
	let mockGitExtensionService: IGitExtensionService;
	let mockGitApi: API;
	let onDidChangeEmitter: Emitter<{ enabled: boolean }>;
	let onDidOpenRepositoryEmitter: Emitter<Repository>;
	let mockRepositories: Repository[];

	beforeEach(() => {
		onDidChangeEmitter = new Emitter<{ enabled: boolean }>();
		onDidOpenRepositoryEmitter = new Emitter<Repository>();

		mockRepositories = [];

		mockGitApi = {
			state: 'initialized',
			onDidChangeState: Event.None,
			onDidPublish: Event.None,
			git: { path: '/usr/bin/git' },
			repositories: mockRepositories,
			onDidOpenRepository: onDidOpenRepositoryEmitter.event,
			onDidCloseRepository: Event.None,
			toGitUri: vi.fn(),
			getRepository: vi.fn(),
			getRepositoryRoot: vi.fn(),
			init: vi.fn(),
			openRepository: vi.fn(),
			registerRemoteSourcePublisher: vi.fn(),
			registerRemoteSourceProvider: vi.fn(),
			registerCredentialsProvider: vi.fn(),
			registerPostCommitCommandsProvider: vi.fn(),
			registerPushErrorHandler: vi.fn(),
			registerBranchProtectionProvider: vi.fn(),
			clone: vi.fn(),
			getRepositoryWorkspace: vi.fn(),
		} as unknown as API;

		mockGitExtensionService = {
			_serviceBrand: undefined,
			onDidChange: onDidChangeEmitter.event,
			extensionAvailable: true,
			getExtensionApi: vi.fn().mockReturnValue(mockGitApi),
		} as unknown as IGitExtensionService;
	});

	afterEach(() => {
		onDidChangeEmitter.dispose();
		onDidOpenRepositoryEmitter.dispose();
	});

	function createMockRepository(rootUri: URI, branchName: string | undefined = 'main'): Repository {
		const stateEmitter = new Emitter<void>();
		const mockState: RepositoryState = {
			HEAD: branchName ? { name: branchName, type: 0, commit: 'abc123' } as Branch : undefined,
			refs: [],
			remotes: [],
			submodules: [],
			worktrees: [],
			rebaseCommit: undefined,
			mergeChanges: [],
			indexChanges: [],
			workingTreeChanges: [],
			untrackedChanges: [],
			onDidChange: stateEmitter.event,
		};

		return {
			rootUri,
			state: mockState,
			ui: {
				selected: false,
				onDidChange: Event.None,
			},
		} as unknown as Repository;
	}

	test('handles undefined repositories', async () => {
		// Mock repositories to be undefined
		Object.defineProperty(mockGitApi, 'repositories', {
			get: () => undefined,
			configurable: true,
		});

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Should not throw "items is not iterable"
		// Wait a bit for initialization
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should handle gracefully - branch should be undefined
		assert.strictEqual(observableGit.branch.get(), undefined);

		observableGit.dispose();
	});

	test('handles null repositories', async () => {
		// Mock repositories to be null
		Object.defineProperty(mockGitApi, 'repositories', {
			get: () => null,
			configurable: true,
		});

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Should not throw "items is not iterable"
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(observableGit.branch.get(), undefined);

		observableGit.dispose();
	});

	test('handles empty repositories array', async () => {
		// Repositories is already empty array from beforeEach
		mockRepositories.length = 0;

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Should initialize without errors
		await new Promise(resolve => setTimeout(resolve, 100));

		// Branch should be undefined when no repositories
		assert.strictEqual(observableGit.branch.get(), undefined);

		observableGit.dispose();
	});

	test('handles valid repositories', async () => {
		const repoUri = URI.file('/test/repo');
		const mockRepo = createMockRepository(repoUri, 'main');
		mockRepositories.push(mockRepo);

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Wait for initialization
		await new Promise(resolve => setTimeout(resolve, 200));

		// Branch should be set to the repository's branch name
		assert.strictEqual(observableGit.branch.get(), 'main');

		observableGit.dispose();
	});

	test('handles repository with invalid URI scheme', async () => {
		// Create a URI with invalid scheme characters
		const invalidUri = {
			toString: () => {
				throw new Error('[UriError]: Scheme contains illegal characters.');
			},
			fsPath: '/test/repo',
			path: '/test/repo',
		} as unknown as URI;

		const mockRepo = createMockRepository(invalidUri, 'main');
		mockRepositories.push(mockRepo);

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Should not throw error - should fallback to fsPath
		await new Promise(resolve => setTimeout(resolve, 200));

		// Should still work and set branch
		assert.strictEqual(observableGit.branch.get(), 'main');

		observableGit.dispose();
	});

	test('handles repository with valid URI', async () => {
		const repoUri = URI.file('/test/repo');
		const mockRepo = createMockRepository(repoUri, 'feature-branch');
		mockRepositories.push(mockRepo);

		const observableGit = new ObservableGit(mockGitExtensionService);

		await new Promise(resolve => setTimeout(resolve, 200));

		// Should use toString() successfully
		assert.strictEqual(observableGit.branch.get(), 'feature-branch');

		observableGit.dispose();
	});

	test('handles initialization when gitApi is undefined', async () => {
		// Mock getExtensionApi to return undefined
		vi.mocked(mockGitExtensionService.getExtensionApi).mockReturnValue(undefined);

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Should not crash
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(observableGit.branch.get(), undefined);

		observableGit.dispose();
	});

	test('handles disposal during initialization', async () => {
		const repoUri = URI.file('/test/repo');
		const mockRepo = createMockRepository(repoUri, 'main');
		mockRepositories.push(mockRepo);

		const observableGit = new ObservableGit(mockGitExtensionService);

		// Dispose immediately
		observableGit.dispose();

		// Should not throw errors
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should be disposed
		assert.strictEqual(observableGit.branch.get(), undefined);
	});

	test('updates branch when repository state changes', async () => {
		const repoUri = URI.file('/test/repo');
		const stateEmitter = new Emitter<void>();
		const mockState: RepositoryState = {
			HEAD: { name: 'initial-branch', type: 0, commit: 'abc123' } as Branch,
			refs: [],
			remotes: [],
			submodules: [],
			worktrees: [],
			rebaseCommit: undefined,
			mergeChanges: [],
			indexChanges: [],
			workingTreeChanges: [],
			untrackedChanges: [],
			onDidChange: stateEmitter.event,
		};

		const mockRepo = {
			rootUri: repoUri,
			state: mockState,
			ui: {
				selected: false,
				onDidChange: Event.None,
			},
		} as unknown as Repository;

		mockRepositories.push(mockRepo);

		const observableGit = new ObservableGit(mockGitExtensionService);

		await new Promise(resolve => setTimeout(resolve, 200));

		assert.strictEqual(observableGit.branch.get(), 'initial-branch');

		// Update the branch
		(mockState as { HEAD: Branch | undefined }).HEAD = { name: 'updated-branch', type: 0, commit: 'def456' } as Branch;
		stateEmitter.fire();

		// Wait for update
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(observableGit.branch.get(), 'updated-branch');

		observableGit.dispose();
		stateEmitter.dispose();
	});
});

