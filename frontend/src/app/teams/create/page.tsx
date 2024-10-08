'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { SuperheroAttributesType, SuperheroBaseType } from '@/types/superhero';
import {
	useCreateTeam,
	useSuperheroes,
	useTeamSuggestion,
} from '@/lib/react-query-hooks';
import Image from 'next/image';
import Loading from '@/app/loading';
import { toast } from 'react-toastify';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { TeamTypeToValuesMapper } from '@/lib/team-recommendation-mapper';
import { attributes } from '@/lib/superhero-attributes';

const MAX_TEAM_MEMBERS = parseInt(
	process.env.NEXT_PUBLIC_MAX_TEAM_MEMBERS ?? '10'
);

export default function CreateTeam() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [teamName, setTeamName] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [recommendationType, setRecommendationType] = useState('balanced');
	const [sortingPriority, setSortingPriority] = useState('');
	const [isRecommendationRequested, setRecommendationRequested] =
		useState(false);
	const [searchTermDebounced] = useDebounce(searchTerm, 500);
	const [selectedSuperheroes, setSelectedSuperheroes] = useState<
		SuperheroBaseType[]
	>([]);
	const [isResultsVisible, setResultsVisible] = useState(false);
	const { data: superheroes, isLoading } = useSuperheroes(
		{
			page: 1,
			size: MAX_TEAM_MEMBERS,
		},
		searchTermDebounced,
		Boolean(searchTermDebounced)
	);
	const { isPending, mutate } = useCreateTeam({
		name: teamName,
		teamMembers: selectedSuperheroes.map((superhero) => superhero.id),
	});
	const { data: recommendedSuperheros } = useTeamSuggestion({
		superheroSuggestionParams:
			TeamTypeToValuesMapper[recommendationType ?? 'balanced'],
		sortingPriority: sortingPriority ?? undefined,
		enabled: isRecommendationRequested,
	});

	const resultsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/login?redirect=/teams/create');
		}
	}, [isAuthenticated, router]);

	// for closing the results div when user clicks outside the div
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				resultsRef.current &&
				!resultsRef.current.contains(event.target as Node)
			) {
				setResultsVisible(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const addHero = (hero: SuperheroBaseType) => {
		if (
			selectedSuperheroes.length < MAX_TEAM_MEMBERS &&
			!selectedSuperheroes.find((h) => h.id === hero.id)
		) {
			setSelectedSuperheroes([...selectedSuperheroes, hero]);
			// setResultsVisible(false); // Hide results after selection
		}
	};

	const removeHero = (heroId: number) => {
		setSelectedSuperheroes(
			selectedSuperheroes.filter((hero) => hero.id !== heroId)
		);
	};

	// for displaying resutls of recommendation
	useEffect(() => {
		setSelectedSuperheroes(recommendedSuperheros ?? []);
		setRecommendationRequested(false);
	}, [recommendedSuperheros]);

	return (
		<main className='container mx-auto py-8 px-12'>
			<h1 className='text-2xl font-bold mb-4'>Create Team</h1>
			<Input
				type='text'
				placeholder='Enter team name (minimum 3 characters)'
				value={teamName}
				onChange={(e) => setTeamName(e.target.value)}
				className='mb-4'
			/>
			<div className='relative mb-4'>
				<Input
					type='text'
					placeholder='Search superheroes'
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setResultsVisible(true); // Show results when typing
					}}
					className='pr-10'
				/>
				<Search className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
				{isResultsVisible && searchTerm && (
					<div
						ref={resultsRef}
						className='absolute z-10 mt-2 w-full overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg'
					>
						<Card className='m-0 p-0'>
							<CardContent className='p-4'>
								{isLoading ? (
									<Loading className='flex items-center justify-center h-10 w-10' />
								) : (
									superheroes?.results?.map((superhero) => (
										<div
											key={superhero.id}
											onClick={() => addHero(superhero)}
											className='flex items-center mb-2 p-2 rounded-lg transition-all duration-300 hover:bg-secondary hover:shadow-md cursor-pointer'
										>
											<Image
												src={superhero.image_url ?? '/superhero-avatar.jpg'}
												alt={superhero.name}
												className='rounded-full mr-3'
												height={40}
												width={40}
											/>
											<Button
												variant='ghost'
												className={`w-full justify-start font-bold text-md ${
													superhero.alignment === 'good'
														? 'text-green-500'
														: superhero.alignment === 'bad'
														? 'text-red-500'
														: superhero.alignment === 'neutral'
														? 'text-neutral-500'
														: 'text-blue-500'
												}`}
												disabled={
													selectedSuperheroes.length >= MAX_TEAM_MEMBERS ||
													!!selectedSuperheroes.find(
														(h) => h.id === superhero.id
													)
												}
											>
												{superhero.name} ({superhero.publisher})
											</Button>
											<div className='flex flex-wrap lg:flex-nowrap items-start'>
												<Attribute
													label='Intelligence'
													value={superhero.intelligence}
												/>
												<Attribute
													label='Strength'
													value={superhero.strength}
												/>
												<Attribute label='Speed' value={superhero.speed} />
												<Attribute
													label='Durability'
													value={superhero.durability}
												/>
												<Attribute label='Power' value={superhero.power} />
												<Attribute label='Combat' value={superhero.combat} />
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
			<div className='mb-4'>
				<h2 className='text-xl font-semibold mb-2'>
					Selected Heroes ({selectedSuperheroes.length}/{MAX_TEAM_MEMBERS})
				</h2>
				<div className='flex flex-wrap gap-2'>
					{selectedSuperheroes.map((superhero) => (
						<Card
							key={superhero.id}
							className={`border-4 mb-4 shadow-lg rounded-lg transition-transform duration-300 hover:shadow-xl hover:bg-secondary ${
								superhero.alignment === 'good'
									? 'border-green-500'
									: superhero.alignment === 'bad'
									? 'border-red-500'
									: superhero.alignment === 'neutral'
									? 'border-neutral-500'
									: 'border-blue-500'
							}`}
						>
							<CardContent className='p-4'>
								<div className='flex items-center justify-center mb-2'>
									<Image
										src={superhero.image_url ?? '/superhero-avatar.jpg'}
										alt={superhero.name}
										className='rounded-full mr-3'
										height={40}
										width={40}
									/>
									<Button
										variant='ghost'
										className='flex items-center gap-2 cursor-auto'
									>
										{superhero.name} ({superhero.publisher})
										<X
											className='cursor-pointer'
											onClick={() => removeHero(superhero.id)}
											size={16}
										/>
									</Button>
								</div>
								{/* Display superhero attributes */}
								<div className='mt-2 flex flex-wrap gap-2 items-center justify-center'>
									{attributes.map((attr) => (
										<div
											key={attr}
											className='flex justify-center bg-gray-100 dark:bg-slate-800 rounded-lg py-1 text-xs font-medium w-1/3'
										>
											<span className='capitalize mr-1'>{attr}:</span>
											<span>{superhero[attr as keyof SuperheroAttributesType]}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
			<div className='w-full flex justify-center'>
				<Button
					type='button'
					variant='default'
					className='w-2/6'
					disabled={
						!teamName || teamName.length < 3 || selectedSuperheroes.length === 0
					}
					onClick={() =>
						mutate(undefined, {
							onSuccess: () => {
								toast('Team created successfully!', { type: 'success' });
								router.push('/teams/list');
							},
							onError: (error) => {
								toast(error.message, { type: 'error' });
							},
						})
					}
				>
					Create Team
					{isPending && <Loading />}
				</Button>
			</div>
			<div className='mt-32 w-full flex justify-center items-center flex-col'>
				<Dialog>
					<DialogTrigger className='mt-12' asChild>
						<Button type='button' variant='default'>
							Autogenerate?
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-md flex flex-col items-center justify-center'>
						<DialogHeader>
							<DialogTitle>Autogenerate</DialogTitle>
							<DialogDescription>
								Please select an option and autogenerate team based on the
								criteria.
							</DialogDescription>
							<Select onValueChange={setRecommendationType}>
								<SelectTrigger className='w-full my-4'>
									<SelectValue placeholder='Select team alignment' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='balanced'>Balanced Team</SelectItem>
									<SelectItem value='good'>Good Team</SelectItem>
									<SelectItem value='bad'>Bad Team</SelectItem>
									<SelectItem value='neutral'>Neutral Team</SelectItem>
								</SelectContent>
							</Select>
							<Select onValueChange={setSortingPriority}>
								<SelectTrigger className='w-full my-4'>
									<SelectValue placeholder='Select priority' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='intelligence'>Intelligent Team</SelectItem>
									<SelectItem value='strength'>Strong Team</SelectItem>
									<SelectItem value='speed'>Fast Team</SelectItem>
									<SelectItem value='durability'>Durable Team</SelectItem>
									<SelectItem value='power'>Powerful Team</SelectItem>
									<SelectItem value='combat'>Combative Team</SelectItem>
								</SelectContent>
							</Select>
						</DialogHeader>
						<DialogFooter className='justify-center ite'>
							<DialogClose asChild>
								<Button
									type='button'
									variant='default'
									onClick={() => setRecommendationRequested(true)}
								>
									Generate
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</main>
	);
}

// Attribute component for displaying attributes with label and value
const Attribute = ({
	label,
	value,
}: {
	label: string;
	value: number | null;
}) => (
	<div className='flex items-center text-sm space-x-1 mr-2'>
		<span className='font-semibold'>{label}: </span>
		{` ${value !== null ? value : 'N/A'}`}
	</div>
);
