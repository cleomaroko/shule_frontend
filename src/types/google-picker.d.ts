export {}

interface GoogleTokenClient {
  requestAccessToken: (override?: { prompt?: string }) => void
}

interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder
  setOAuthToken: (token: string) => GooglePickerBuilder
  setDeveloperKey: (key: string) => GooglePickerBuilder
  setAppId: (appId: string) => GooglePickerBuilder
  setCallback: (callback: (data: Record<string, unknown>) => void) => GooglePickerBuilder
  setTitle: (title: string) => GooglePickerBuilder
  setOrigin: (origin: string) => GooglePickerBuilder
  setMaxItems: (max: number) => GooglePickerBuilder
  build: () => { setVisible: (visible: boolean) => void }
}

interface GoogleDocsView {
  setIncludeFolders: (include: boolean) => GoogleDocsView
  setMimeTypes: (types: string) => GoogleDocsView
}

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
    }
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              expires_in?: number
              error?: string
              error_description?: string
            }) => void
          }) => GoogleTokenClient
        }
      }
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder
        DocsView: new (viewId?: string) => GoogleDocsView
        ViewId: { DOCS_IMAGES: string }
        Action: { PICKED: string; CANCEL: string }
        Response: { ACTION: string; DOCUMENTS: string }
        Document: { ID: string; NAME: string; URL: string; MIME_TYPE: string }
      }
    }
  }
}
