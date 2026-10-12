import * as vscode from 'vscode'

import { retiredSocketApiTokenFixture } from '../fixtures/retired-api-token.mts'
import {
  activate as activateAuth,
  getAPIKey,
  migrateApiTokenToSecretStorage,
  sessionFromAPIKey,
} from '../../../src/auth.mts'

export function activate(context: vscode.ExtensionContext) {
  return {
    __proto__: null,
    activateAuth: () => activateAuth(context, context.subscriptions),
    context,
    getAPIKey,
    migrateApiTokenToSecretStorage,
    retiredSocketApiTokenFixture,
    sessionFromAPIKey,
  }
}
