// scripts/build-registry.ts testing
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import glob from 'fast-glob'

async function loadIntegration(integrationPath: string) {
  const integrationYamlPath = path.join(integrationPath, 'integration.yaml')
  const raw = await fs.readFile(integrationYamlPath, 'utf8')
  const integration = yaml.load(raw) as any

  const eventsDir = path.join(integrationPath, 'events')

  const functionPaths = await glob('functions/*/*/function.yaml', { cwd: integrationPath })
  const eventFiles = (await fs.readdir(eventsDir).catch(() => []))

  return {
    id: integration.id,
    name: integration.name,
    uri: integrationPath,
    version: integration.version,
    icon: integration.icon,
    category: integration.category,
    tasks: functionPaths.map((file) => {
      const parts = file.split('/')
      return {
        id: parts[1], // functionName
        version: parts[2] // version
      }
    }),
    events: eventFiles.map((file) => ({ id: file.replace('.event.yaml', '') })),
  }
}

async function main() {
  const root = path.resolve('integrations')
  const dirs = await fs.readdir(root)
  const registry = await Promise.all(
    dirs.map((d) => loadIntegration(path.join(root, d)))
  )
  await fs.writeFile('registry.json', JSON.stringify(registry, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
 