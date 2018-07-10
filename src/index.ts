import * as GitHub from 'github-api';


const protectedBranchStat = async(data) => {
    const protectedBranchesPromises = data.map(async ({default_branch, name}):Promise<{name: string, isProtected: boolean}> => {
        try {
            const branchInfo = (await gh.getRepo('Soluto', name).getBranch(default_branch)).data
            return {...data, isProtected: branchInfo.protected}
        } catch (e) {
            return {...data, isProtected: false}
        }
    })
    const branchesWithProtection = await Promise.all<{name: string, isProtected: boolean}>(protectedBranchesPromises)
    const protectedBranches = branchesWithProtection.filter(x => x.isProtected)
    console.log(`Out of ${data.length} repos, ${protectedBranches.length} have their main branch protected, ${data.length - protectedBranches.length} do not`)

  }

const languageStat = (data) => {
    const result = data.reduce((accum, repo) => {
        accum[repo.language] ? accum[repo.language]++ : accum[repo.language] = 1
        return accum
    }, {})
    const sorted = Object.keys(result).sort((a, b) => result[b] - result[a])
    .map(key => ({[key]: result[key]}))
    console.log(`Here are the used languages in Soluto: \n ${JSON.stringify(sorted)}`)
} 


const contributersStats = async (data) => {
    const promises = data.map(async ({name}) => {
        let stats
        try {
            const response = (await gh.getRepo('Soluto', name).getContributors()).data
            stats = response.map(stat => ({name: stat.login, contributions: stat.contributions}))
        } catch (e) {
            stats = []
        }
        return {name, contributors: stats}
    })
    const result = await Promise.all(promises)

    const allContributions = result.reduce((sum, repo: {name: string, contributors: {name: string, contributions: number}[]}) => {
        repo.contributors.forEach(x => {
            sum[x.name] ? sum[x.name]+= x.contributions : sum[x.name] = x.contributions
        });
        return sum
    }, {})
    const sorted = Object.keys(allContributions)
    .filter(key => allContributions[key] > 15)
    .sort((a, b)=> allContributions[b] - allContributions[a])
    .slice(0, 11)
    .map(key => ({[key]: allContributions[key]}))
    console.log(`Here are the top 10 contributors to the Soluto github org: \n ${JSON.stringify(sorted)}`)
}

const gh = new GitHub({
    token:'355098fbac284e4029bebfa4518fece03fa5be00' 
 });

 
 (async function() {
    const soluto = await gh.getOrganization('Soluto').getRepos()
    const {data} = soluto
    const numOfPrivateRepos = data.filter(repo => repo.private).length
    console.log(`Soluto org has ${data.length} repos, ${numOfPrivateRepos} private repos, ${data.length - numOfPrivateRepos} public repos`)
    
    // List of repos with protected branches 
    await protectedBranchStat(data)

    // List of used languages
    languageStat(data)

    // List of contributors
    await contributersStats(data)


  })()


