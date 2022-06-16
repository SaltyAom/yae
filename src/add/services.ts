import { repo } from '../config'

import chalk from 'chalk'
import degit from 'degit'

import fs from 'fs/promises'
import { existsSync } from 'fs'

import { exec } from 'child_process'
import cmdExists from 'command-exists'

import rimraf from 'rimraf'

import type { PackageJson } from './types'

export const clone = (name: string) =>
    new Promise<void>((resolve) =>
        degit(`${repo}/${name}`)
            .clone(`.yae/${name}`)
            .then(resolve)
            .catch(() => {
                if (existsSync(`.yae/${name}`)) return resolve()

                console.log(`Unable to download ${chalk.cyan.bold(name)}`)
                process.exit(1)
            })
    )

export const removeIfExists = async (file: string) => {
    if (existsSync(file)) await new Promise((resolve) => rimraf(file, resolve))
}

export const download = async (name: string) => {
    if (!name) return [name]

    await clone(name)

    let deps: string[] = []
    const requirement = `.yae/${name}/deps`

    if (existsSync(requirement)) {
        const request = await fs.readFile(requirement, {
            encoding: 'utf-8'
        })

        deps = request.trim().split('\n')
    }

    if (deps.length) await Promise.all(deps.map((dep) => download(dep)))

    return [name, ...deps]
}

export const readPackageJson = async (path: string) => {
    const packageJson: PackageJson = JSON.parse(
        await fs.readFile(`${path}/package.json`, {
            encoding: 'utf-8'
        })
    )

    if (!packageJson.dependencies) packageJson.dependencies = {}
    if (!packageJson.devDependencies) packageJson.devDependencies = {}

    return packageJson
}

// @side-effect
export const addPackage = async (packageJson: PackageJson, module: string) => {
    const newPackage = await readPackageJson(`.yae/${module}`)

    packageJson.dependencies = {
        ...newPackage.dependencies,
        ...packageJson.dependencies
    }

    packageJson.devDependencies = {
        ...newPackage.devDependencies,
        ...packageJson.devDependencies
    }
}

export const addEnv = async (envs: string, module: string) => {
    const envFile = `.yae/${module}/.env.example`

    if (!existsSync(envFile)) return envs

    const locals = await fs
        .readFile(envFile, {
            encoding: 'utf-8'
        })
        .then((r) => r.trim().split('\n'))

    locals.forEach((local) => {
        const containsEnv = new RegExp(`^${local.slice(0, -1)}`, 'gm')

        if (!containsEnv.test(envs)) envs += '\n' + local
    })

    return envs
}

export const readEnv = async () => {
    if (!existsSync('.env')) return ''

    return await fs.readFile('.env', {
        encoding: 'utf-8'
    })
}

export const command = (args: string) =>
    new Promise((resolve) => exec(args).on('exit', resolve))

export const installNewPackage = async () => {
    if (existsSync('pnpm-lock.yaml')) return command('pnpm install')
    if (existsSync('yarn.lock')) return command('yarn install')
    if (existsSync('package-lock.json')) return command('npm install')

    if (await cmdExists('pnpm')) return command('pnpm install')
    else if (await cmdExists('yarn')) return command('yarn install')
    else return command('npm install')
}
