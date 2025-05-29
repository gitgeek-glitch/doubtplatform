import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import QuestionCard from "@/components/question-card"
import AnswerCard from "@/components/profile/AnswerCard"

interface ProfileTabsProps {
  questions: any[]
  answers: any[]
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ProfileTabs({ questions, answers, activeTab, setActiveTab }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="questions" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="profile-tabs-list">
        <TabsTrigger value="questions" className={cn(activeTab === "questions" && "profile-tab-active")}>
          Questions ({questions.length})
        </TabsTrigger>
        <TabsTrigger value="answers" className={cn(activeTab === "answers" && "profile-tab-active")}>
          Answers ({answers.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="questions" className="profile-content">
        {questions.length > 0 ? (
          questions.map((question: any) => <QuestionCard key={question._id} question={question} />)
        ) : (
          <div className="profile-empty-state">
            <p className="text-muted-foreground">No questions asked yet</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="answers" className="profile-content">
        {answers.length > 0 ? (
          answers.map((answer: any) => <AnswerCard key={answer._id} answer={answer} />)
        ) : (
          <div className="profile-empty-state">
            <p className="text-muted-foreground">No answers provided yet</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}