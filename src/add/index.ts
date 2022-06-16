import chalk from 'chalk'
import task from 'tasuku'

import { existsSync } from 'fs'
import fs from 'fs/promises'

import PQueue from 'p-queue'

import { file, repo } from '../config'

import mergeDirs from '../services/merge-dirs'
import { fetchModules } from '../list'

import {
    removeIfExists,
    download,
    readPackageJson,
    addPackage,
    addEnv,
    readEnv,
    command,
    installNewPackage
} from './services'

const packageQueue = new PQueue({
    concurrency: 1
})

const envQueue = new PQueue({
    concurrency: 1
})

export default async (args: string[]) => {
    await removeIfExists('.yae')

    if (!existsSync('package.json')) {
        console.log(`${chalk.cyan.bold('package.json')} not found`)
        process.exit(1)
    }

    await task(`Fetch Module`, async () => {
        const repos = await fetchModules()

        const invalid = repos.find((repo) => !repos.includes(repo))

        if (invalid) {
            console.log(`${chalk.cyan.bold(invalid)} is not a valid module`)
            process.exit(1)
        }
    })

    const { result: modules } = await task(`Download modules`, () =>
        Promise.all(args.map((name) => download(name))).then((deps) =>
            deps.flat()
        )
    )

    let [envs, packageJson] = await Promise.all([
        readEnv(),
        readPackageJson('.')
    ])

    const totalPackage =
        packageJson.dependencies.length + packageJson.devDependencies.length

    const mergeOps: Promise<void>[] = []

    for (const module of modules) {
        mergeOps.push(mergeDirs(`.yae/${module}/src`, 'src'))

        envQueue.add(async () => {
            envs = await addEnv(envs, module)
        })

        packageQueue.add(() => addPackage(packageJson, module))
    }

    await task(`Install module`, async () => {
        await Promise.all([
            ...mergeOps,
            envQueue.onEmpty(),
            packageQueue.onEmpty()
        ])
        await fs.writeFile('package.json', JSON.stringify(packageJson, null, 4))
    })

    envs = envs.trim()

    await task(`Clean up`, async () => {
        if (envs) await fs.writeFile('.env', envs)
        await removeIfExists('.yae')
    })

    if (
        totalPackage !==
        packageJson.dependencies.length + packageJson.devDependencies.length
    )
        await task(`Install package`, installNewPackage)

    console.log(chalk.cyan.bold('\nNew modules installed'))
    args.forEach((arg) => {
        console.log(`- ${arg}`)
    })
    console.log('')
}
