import fetch from 'isomorphic-unfetch'
import task from 'tasuku'

import chalk from 'chalk'

import { repo, file } from '../config'

export const fetchModules = (): Promise<string[]> =>
    fetch(`${file}/repo`)
        .then((r: any) => r.text())
        .then((r: string) => r.trim().split('\n'))

export default async (args: string[]) => {
    const { result: repos } = await task(`Fetching Module`, fetchModules)

    console.clear()

    if (repos[0] === 'Not Found') return

    console.log(
        `${chalk.cyan.bold(repos.length)} ${chalk.cyan.bold(
            'modules'
        )} available:`
    )

    repos.forEach((repo) => {
        console.log(repo)
    })
}
