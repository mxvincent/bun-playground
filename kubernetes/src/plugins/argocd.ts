export enum ArgoCDAnnotation {
	HOOK = 'argocd.argoproj.io/hook',
	HOOK_DELETE_POLICY = 'argocd.argoproj.io/hook-delete-policy',
	SYNC_OPTIONS = 'argocd.argoproj.io/sync-options'
}

export enum ArgocdHook {
	POST_SYNC = 'PostSync',
	PRE_SYNC = 'PreSync',
	SKIP = 'Skip',
	SYNC = 'Sync',
	SYNC_FAIL = 'SyncFail'
}

export enum ArgocdHookDeletePolicy {
	BEFORE_CREATION = 'BeforeHookCreation',
	FAILED = 'HookFailed',
	SUCCEEDED = 'HookSucceeded'
}
